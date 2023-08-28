import { getAlchemy } from "@/lib/clients";
import useSWR from "swr";
import { getAlchemyImageSrc } from "@/lib/utils";
import { useEffect, useState } from "react";
import axios from "axios";
import getMetadata from "../getMetadata";
import getIpfsLink from "../getIpfsLink";

function formatImageReturn(imageData?: string | string[]): string[] {
  if (!imageData) {
    return ["/no-img.jpg"];
  }

  return typeof imageData === "string" ? [imageData] : imageData;
}

interface CustomImplementation {
  contractAddress: `0x${string}`;
}

export const useNft = ({
  tokenId,
  apiEndpoint,
  refreshInterval = 120000,
  cacheKey,
  contractAddress,
  hasCustomImplementation,
  chainId
}: {
  tokenId: number;
  apiEndpoint?: string;
  refreshInterval?: number;
  cacheKey?: string;
  contractAddress: `0x${string}`;
  hasCustomImplementation: boolean;
  chainId: number
}) => {
  const [image, setImage] = useState("")
  let key = null;
  if (hasCustomImplementation) key = cacheKey ?? `getNftAsset-${tokenId}`;

  useEffect(() => {
    const init = async () => {
      const metadata = getMetadata(tokenId)
      const photo = getIpfsLink(metadata.image)
      setImage(photo)
    }
    init()
  },[tokenId])

  const { data: nftMetadata, isLoading: nftMetadataLoading } = useSWR(
    `nftMetadata/${contractAddress}/${tokenId}`,
    (url: string) => {
      const [, contractAddress, tokenId] = url.split("/");
      const alchemy = getAlchemy(chainId)
      return alchemy.nft.getNftMetadataBatch([{ contractAddress, tokenId }]);
    }
  );

  console.log("SWEETS nftMetadata", nftMetadata)

  return {
    data: [image],
    nftMetadata: nftMetadata?.[0],
    loading: nftMetadataLoading,
  };
};
