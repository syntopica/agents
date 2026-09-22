export type ForcedLoginMethodResult =
  | { ok: true; contents: string; changed: boolean }
  | { ok: false; errors: string[] }
