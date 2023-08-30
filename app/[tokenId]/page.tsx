"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { isNil } from "lodash";
import { getAccount, getAccountStatus, getLensNfts, getNfts } from "@/lib/utils";
import { rpcClient } from "@/lib/clients";
import { TbLogo } from "@/components/icon";
import { useNft } from "@/lib/hooks";
import { TbaOwnedNft } from "@/lib/types";
import { TokenDetail } from "./TokenDetail";
import { HAS_CUSTOM_IMPLEMENTATION } from "@/lib/constants";
import { getTotalSupply } from "@/lib/utils/getTotalSupply";
import { parse } from "path";

interface TokenParams {
  params: {
    tokenId: string;
  };
  searchParams: {
    apiEndpoint: string;
  };
}

export default function Token({ params, searchParams }: TokenParams) {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [totalSupply, setTotalSupply] = useState<string | undefined>("8888");
  const [nfts, setNfts] = useState<TbaOwnedNft[]>([]);
  const [lensNfts, setLensNfts] = useState<TbaOwnedNft[]>([]);
  const contractAddress = process.env.NEXT_PUBLIC_CRE8ORS_ADDRESS as string;
  const chainId = process.env.NEXT_PUBLIC_TESTNET ? 5 : 1;
  const { tokenId } = params;
  const [showTokenDetail, setShowTokenDetail] = useState(false);

  const {
    data: nftImages,
    nftTitle,
    loading: nftMetadataLoading,
  } = useNft({
    tokenId: parseInt(tokenId as string),
    contractAddress: contractAddress as `0x${string}`,
    hasCustomImplementation: HAS_CUSTOM_IMPLEMENTATION,
    chainId,
  });
  const establishTotalSupply = useCallback(async () => {
    const { supply } = await getTotalSupply(chainId);
    setTotalSupply(supply);
  }, [chainId]);
  useEffect(() => {
    establishTotalSupply();
  }, [establishTotalSupply]);

  useEffect(() => {
    if (!isNil(nftImages) && nftImages.length) {
      const imagePromises = nftImages.map((src: string) => {
        return new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = resolve;
          image.onerror = reject;
          image.src = src;
        });
      });

      Promise.all(imagePromises)
        .then(() => {
          setImagesLoaded(true);
        })
        .catch((error) => {
          console.error("Error loading images:", error);
        });
    }
  }, [nftImages]);

  // Fetch nft's TBA
  const { data: account } = useSWR(tokenId ? `/account/${tokenId}` : null, async () => {
    const result = await getAccount(Number(tokenId), contractAddress, chainId);
    return result.data;
  });

  // Get nft's TBA account bytecode to check if account is deployed or not
  const { data: accountBytecode } = useSWR(
    account ? `/account/${account}/bytecode` : null,
    async () => rpcClient.getBytecode({ address: account as `0x${string}` })
  );

  const accountIsDeployed = accountBytecode && accountBytecode?.length > 2;

  const { data: isLocked } = useSWR(account ? `/account/${account}/locked` : null, async () => {
    if (!accountIsDeployed) {
      return false;
    }

    const { data, error } = await getAccountStatus(chainId, account!);

    return data ?? false;
  });

  // fetch nfts inside TBA
  useEffect(() => {
    async function fetchNfts(account: string) {
      const [data, lensData] = await Promise.all([getNfts(chainId, account), getLensNfts(account)]);
      if (data) {
        setNfts(data);
      }
      if (lensData) {
        setLensNfts(lensData);
      }
    }

    if (account) {
      fetchNfts(account);
    }
  }, [account, accountBytecode, chainId]);

  const [tokens, setTokens] = useState<TbaOwnedNft[]>([]);

  useEffect(() => {
    if (nfts !== undefined && nfts.length) {
      setTokens(nfts);
      if (lensNfts) {
        setTokens([...nfts, ...lensNfts]);
      }
    }
  }, [nfts, lensNfts]);

  if (totalSupply && parseInt(tokenId, 10) > parseInt(totalSupply, 10)) return null;
  return (
    <div className="h-screen w-screen bg-slate-100">
      <div className="max-w-screen relative mx-auto aspect-square max-h-screen overflow-hidden bg-white">
        <div className="relative h-full w-full">
          {account && nftImages && nftTitle && (
            <TokenDetail
              isOpen={showTokenDetail}
              handleOpenClose={setShowTokenDetail}
              approvalTokensCount={0}
              account={account}
              tokens={tokens}
              title={nftTitle}
              chainId={chainId}
            />
          )}
          <div className="max-h-1080[px] relative h-full w-full max-w-[1080px]">
            {nftMetadataLoading ? (
              <div className="absolute left-[45%] top-[50%] z-10 h-20 w-20 -translate-x-[50%] -translate-y-[50%] animate-bounce">
                <TbLogo />
              </div>
            ) : (
              <div
                className={`grid w-full grid-cols-1 grid-rows-1 transition ${
                  imagesLoaded ? "" : "blur-xl"
                }`}
              >
                {!isNil(nftImages) ? (
                  nftImages.map((image, i) => (
                    <img
                      key={i}
                      className="col-span-1 col-start-1 row-span-1 row-start-1 translate-x-0"
                      src={image}
                      alt="Nft image"
                    />
                  ))
                ) : (
                  <></>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
