// Allow pretty-print expansion of the bounded agent result plus target metadata.
export const guidanceProposalByteLimit = (maxOutputBytes: number): number =>
  maxOutputBytes * 8 + 65_536
