/* eslint-disable */
import { useState } from "react";
import { Address } from "./scaffold-eth/Address";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface nftData {
  price?: string;
  tokenId?: number;
  seller?: string;
  owner?: string;
  image?: any;
  name?: string;
  description?: string;
}

export const NFTCard = ({ nft, currentUser }: { nft: nftData; currentUser: string | undefined }) => {
  const [transferToAddress, setTransferToAddress] = useState("");

  /** Contract Hooks */
  const { writeContractAsync: nftMarketplace } = useScaffoldWriteContract("NFTMarketplace");

  const onBuy = async (_tokenId: number | undefined, _price: string | undefined) => {
    if (_tokenId === undefined || _price === undefined) {
      console.error("Token ID or price is undefined");
      return;
    }
    await nftMarketplace({
      functionName: "executeSale",
      args: [BigInt(_tokenId)],
      value: BigInt(parseFloat(_price) * 1e18), // Convert ETH to Wei
    });
  };

  return (
    <div className="card card-compact bg-base-100 shadow-lg sm:min-w-[300px] shadow-secondary">
      <figure className="relative">
        {/* eslint-disable-next-line  */}
        <img src={nft.image} alt="NFT Image" className="h-60 min-w-full" />
        <figcaption className="glass absolute bottom-4 left-4 p-4 w-25 rounded-xl">
          <span className="text-white "># {nft.tokenId}</span>
        </figcaption>
      </figure>
      <div className="card-body space-y-3">
        <div className="flex items-center justify-center">
          <p className="text-xl p-0 m-0 font-semibold">{nft.name}</p>
        </div>
        <div className="flex flex-col justify-center mt-1">
          <p className="my-0 text-lg">{nft.description}</p>
        </div>
        <div className="flex space-x-3 mt-1 items-center">
          <span className="text-lg font-semibold">Owner : </span>
          <Address address={nft.owner} />
        </div>
        <div className="flex space-x-3 mt-1 items-center">
          <span className="text-lg font-semibold">Price : </span>
          <p className="text-xl p-0 m-0 font-semibold">{nft.price} ETH</p>
        </div>
        {nft.seller !== currentUser && (
          <div className="card-actions justify-end">
            <button
              className="btn btn-secondary btn-md px-8 tracking-wide"
              onClick={() => onBuy(nft.tokenId, nft.price)}
            >
              Buy
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
