export const chunkRequests = (requests: string[], perBatch: number) => {
  if (perBatch < 1) {
    return [requests]
  }

  const batches: string[][] = []

  for (let index = 0; index < requests.length; index += perBatch) {
    batches.push(requests.slice(index, index + perBatch))
  }

  return batches
}
