/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";

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

const Marketplace: NextPage = () => {
  const [nfts, setNFTS] = useState<nftData[]>([]);

  const { data: listedNFTs } = useScaffoldReadContract({
    contractName: "NFTMarketplace",
    functionName: "getAllNFTs",
    watch: true,
  });

  const { data: nftMarketplace } = useScaffoldContract({ contractName: "NFTMarketplace" });

  useEffect(() => {
    const getNFTMetadata = async () => {
      if (listedNFTs && nftMarketplace) {
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
              console.error(`Error fetching metadata for token ${i.tokenId}:`, error);
              return null;
            }
          }),
        );
        const validItems: nftData[] = items.filter((item): item is nftData => item !== null);
        console.log("ITEMS", validItems);
        setNFTS(validItems);
      }
    };

    getNFTMetadata();
  }, [listedNFTs]);

  return (
    <>
      <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
        <h1 className="text-center">
          <span className="block text-1xl mb-2">Listed NFTs</span>
        </h1>
        <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
          {nfts.map(nft => (
            <div key={nft.tokenId}>
              <img src={nft.image} alt={nft.name} />
              <p>{nft.name}</p>
              <p>{nft.description}</p>
              <p>Price: {nft.price} ETH</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Marketplace;
