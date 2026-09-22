export const isHighEntropy = (value: string) => {
  const candidate = /[A-Za-z0-9_-]{24,}/.exec(value)?.[0]

  if (candidate === undefined) {
    return false
  }

  return (
    /[a-z]/.test(candidate) && /[A-Z]/.test(candidate) && /\d/.test(candidate)
  )
}
