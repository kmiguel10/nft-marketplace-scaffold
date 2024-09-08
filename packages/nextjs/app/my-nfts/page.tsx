/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { NFTCard } from "~~/components/NFTCard";
import { Spinner } from "~~/components/Spinner";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";

/* eslint-disable */

/* eslint-disable */

/* eslint-disable */

/* eslint-disable */

/* eslint-disable */

/* eslint-disable */

/* eslint-disable */

/* eslint-disable */

/* eslint-disable */

/* eslint-disable */

/* eslint-disable */

/* eslint-disable */

interface nftData {
  price?: string;
  tokenId?: number;
  seller?: string;
  owner?: string;
  image?: any;
  name?: string;
  description?: string;
}

const GetIpfsUrlFromPinata = (pinataUrl: string): string => {
  const IPFSUrlParts = pinataUrl.split("/");
  const lastIndex = IPFSUrlParts.length - 1;
  const IPFSUrl = `https://ipfs.io/ipfs/${IPFSUrlParts[lastIndex]}`;
  return IPFSUrl;
};

const myNFTs: NextPage = () => {
  const [nfts, setNFTS] = useState<nftData[]>([]);
  const { address: connectedAddress } = useAccount();
  const [totalPrice, setTotalPrice] = useState(0);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);

  const { data: listedNFTs } = useScaffoldReadContract({
    contractName: "NFTMarketplace",
    functionName: "getAllNFTs",
    watch: true,
  });

  /** Contract Hooks */
  const { data: nftMarketplace } = useScaffoldContract({ contractName: "NFTMarketplace" });

  useEffect(() => {
    const getNFTMetadata = async () => {
      if (listedNFTs && nftMarketplace) {
        setMarketplaceLoading(true);
        const items: (nftData | null)[] = await Promise.all(
          listedNFTs.map(async i => {
            console.log("Getting tokenId URI: ", i.tokenId);
            try {
              const tokenURI = await nftMarketplace.read.tokenURI([BigInt(i.tokenId)]);

              if (!tokenURI) {
                throw new Error(`TokenURI is undefined for tokenId: ${i.tokenId}`);
              }

              console.log("getting this tokenUri", tokenURI);
              const ipfsUrl = GetIpfsUrlFromPinata(tokenURI.toString());
              // Use the new API route
              const response = await fetch(`/api/fetchMetadata?url=${encodeURIComponent(ipfsUrl)}`);
              if (!response.ok) {
                throw new Error("Failed to fetch metadata");
              }
              const meta = await response.json();
              const price = ethers.formatUnits(i.price.toString(), "ether");

              return {
                price,
                tokenId: Number(i.tokenId),
                seller: i.seller,
                owner: i.owner,
                image: meta.image,
                name: meta.name,
                description: meta.description,
              };
            } catch (error) {
              setMarketplaceLoading(false);
              console.error(`Error fetching metadata for token ${i.tokenId}:`, error);
              return null;
            }
          }),
        );
        const validItems: nftData[] = items.filter(
          (item): item is nftData => item !== null && item.seller === connectedAddress,
        );
        console.log("ITEMS", validItems);
        setNFTS(validItems);

        const total = validItems.reduce((sum, item) => sum + parseFloat(item.price || "0"), 0);
        setTotalPrice(total);
        setMarketplaceLoading(false);
      }
    };

    getNFTMetadata();
  }, [listedNFTs]);

  if (marketplaceLoading)
    return (
      <div className="flex justify-center items-center mt-10">
        <Spinner width="75" height="75" />
      </div>
    );

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-4xl font-bold">My NFTs</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
          <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
            <p className="my-2 font-medium">Total Price of Owned NFTs:</p>
            <p className="text-2xl font-bold">{totalPrice} ETH</p>
          </div>
        </div>
        {nfts.length === 0 ? (
          <div className="flex justify-center items-center mt-10">
            <div className="text-2xl text-primary-content">No NFTs found</div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
            {nfts.map(item => (
              <NFTCard nft={item} currentUser={connectedAddress} key={item.tokenId} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default myNFTs;
