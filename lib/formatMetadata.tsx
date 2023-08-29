const formatMetadata = (raw: any, tokenId: any) => ({
  ...raw,
  name: `Cre8ors #${tokenId}`,
  description: "A cult for creators.",
});

export default formatMetadata;
