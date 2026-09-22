import { unquoteTomlString } from './unquoteTomlString'

export const parseTomlArray = (raw: string) => {
  const inner = raw.trim().slice(1, -1).trim()

  if (inner === '') {
    return []
  }

  return inner.split(',').map((element) => unquoteTomlString(element))
}
