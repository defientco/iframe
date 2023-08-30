import { getPublicClient } from "@/lib/clients/viem";
import { cre8orsAbi } from "@/lib/abi";
import { cre8orsAddress } from "@/lib/constants";

interface GetTotalSupply {
  supply?: string;
  error?: string;
}

export async function getTotalSupply(chainId: number): Promise<GetTotalSupply> {
  try {
    const publicClient = getPublicClient(chainId);
    const response = (await publicClient.readContract({
      address: cre8orsAddress as `0x${string}`,
      abi: cre8orsAbi,
      functionName: "totalSupply",
    })) as number;

    return { supply: response.toString() };
  } catch (error) {
    console.error(error);
    return {
      error: `Failed to get total supply.`,
    };
  }
}
