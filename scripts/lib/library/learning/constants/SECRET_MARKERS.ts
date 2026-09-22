export const SECRET_MARKERS = [
  /\b(ghp_|gho_|github_pat_|sk-|ctx7sk-|fc-|xox[baprs]-|eyJ[A-Za-z0-9_-]{10,64})/,
  /[a-z][a-z0-9+.-]{0,20}:\/\/[^:/@\s]{1,64}:[^/@\s]{1,64}@/i,
  /\b(contrase[nñ]a|password|passwd|clave|api[_ -]?key|token|secreto)\b[ :=]{0,3}\S{6,64}/i,
] as const
