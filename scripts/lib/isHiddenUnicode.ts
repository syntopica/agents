/**
 * True when a code point is invisible Unicode with payload-smuggling potential:
 * variation selectors (U+FE00-FE0F, U+E0100-E01EF) or zero-width characters
 * (ZWSP/ZWNJ/ZWJ/word joiner). GlassWorm hid payloads in variation selectors
 * that no diff shows.
 */
export const isHiddenUnicode = (codePoint: number): boolean =>
  (codePoint >= 0xfe00 && codePoint <= 0xfe0f) ||
  (codePoint >= 0xe0100 && codePoint <= 0xe01ef) ||
  (codePoint >= 0x200b && codePoint <= 0x200d) ||
  codePoint === 0x2060
