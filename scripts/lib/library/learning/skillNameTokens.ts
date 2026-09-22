export const skillNameTokens = (skillKey: string) => {
  const lastSegment = skillKey.split('/').at(-1) ?? skillKey

  return lastSegment
    .split('-')
    .filter((token) => token.length >= 3 && token !== 'core')
}
