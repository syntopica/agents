import { PROCEDURE_STOPWORDS } from './constants/PROCEDURE_STOPWORDS'
import { PROCEDURE_SYNONYMS } from './constants/PROCEDURE_SYNONYMS'

export const tokenizeProcedureName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((token) => PROCEDURE_SYNONYMS[token] ?? token)
    .filter((token) => token.length >= 3 && !PROCEDURE_STOPWORDS.has(token))
