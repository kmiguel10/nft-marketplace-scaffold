"use client";

import { useState } from "react";
import { parseEther } from "ethers";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { uploadFileToIPFS, uploadJSONToIPFS } from "~~/utils/nftMarketplace/pinata";
import { notification } from "~~/utils/scaffold-eth";

interface InputParams {
  name: string;
  description: string;
  price: number;
}

const ListNFT: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [inputParams, setInputParams] = useState<InputParams>({ name: "", description: "", price: 0 });
  const [fileURL, setFileURL] = useState<string | null>(null);

  //** Contract Functions */
  const { writeContractAsync: nftMarketplace } = useScaffoldWriteContract("NFTMarketplace");

  const { data: listPrice } = useScaffoldReadContract({
    contractName: "NFTMarketplace",
    functionName: "getListPrice",
    watch: true,
    // cacheOnBlock: true,
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputParams({ ...inputParams, name: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputParams({ ...inputParams, description: e.target.value });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputParams({ ...inputParams, price: value === "" ? 0 : parseFloat(value) });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      try {
        const response = await uploadFileToIPFS(file);
        if (response.success === true && response.pinataURL) {
          console.log("Uploaded image to Pinata:", response.pinataURL);
          setFileURL(response.pinataURL);
        }
      } catch (error) {
        console.log("Error during file upload", error);
      }
    }
  };

  const uploadMetadataToIPFS = async () => {
    const { name, description, price } = inputParams;
    //Make sure that none of the fields are empty
    if (!name || !description || !price || !fileURL) {
      //updateMessage("Please fill all the fields!")
      return -1;
    }

    const nftJSON = {
      name,
      description,
      price,
      image: fileURL,
    };

    try {
      //upload the metadata JSON to IPFS
      const response = await uploadJSONToIPFS(nftJSON);
      if (response.success === true) {
        console.log("Uploaded JSON to Pinata: ", response);
        return response.pinataURL;
      }
    } catch (e) {
      console.log("error uploading JSON metadata:", e);
    }
  };

  const onListNFT = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const notificationId = notification.loading("Uploading to IPFS");
    //Upload data to IPFS
    try {
      const metadataURL = await uploadMetadataToIPFS();

      if (metadataURL === -1) return;

      // First remove previous loading notification and then show success notification
      notification.remove(notificationId);
      notification.success("Metadata uploaded to IPFS");
      const price = parseEther(inputParams.price.toString());

      await nftMarketplace({
        functionName: "createToken",
        args: [metadataURL, price],
        value: listPrice,
      });

      alert("Successfully listed your NFT!");
      setInputParams({ name: "", description: "", price: 0 });
      window.location.replace("/");
    } catch (e) {
      notification.remove(notificationId);
      console.error(e);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-4xl font-bold">List NFT</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
        </div>

        <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-md rounded-3xl gap-2">
              <label className="input input-bordered flex items-center gap-2 w-full">
                Name
                <input
                  type="text"
                  className="grow"
                  placeholder=""
                  value={inputParams.name}
                  onChange={handleNameChange}
                />
              </label>
              <textarea
                placeholder="Description"
                className="textarea textarea-bordered textarea-md w-full"
                value={inputParams.description}
                onChange={handleDescriptionChange}
              ></textarea>
              <label className="input input-bordered flex items-center gap-2 w-full">
                Price (eth)
                <input
                  type="number"
                  className="grow"
                  placeholder="0.00"
                  value={inputParams.price === 0 ? "" : inputParams.price} // Handle empty state
                  onChange={handlePriceChange}
                  step="0.01" // Allows for decimal input
                />
              </label>
              <input type="file" className="file-input file-input-bordered w-full" onChange={handleFileChange} />
              <button className="btn btn-success w-full" onClick={onListNFT}>
                List NFT
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ListNFT;
