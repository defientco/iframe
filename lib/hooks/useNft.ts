import { getAlchemy } from "@/lib/clients";
import useSWR from "swr";
import { useEffect, useState } from "react";
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
  const [metadata, setMetadata] = useState({} as any)
  let key = null;
  if (hasCustomImplementation) key = cacheKey ?? `getNftAsset-${tokenId}`;

  useEffect(() => {
    const init = async () => {
      setMetadata(getMetadata(tokenId))
    }
    init()
  },[tokenId])

  return {
    data: [getIpfsLink(metadata?.image)],
    nftTitle: metadata.name,
    loading: false,
  };
};
