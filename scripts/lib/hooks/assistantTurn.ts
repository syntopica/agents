/**
 * Build one assistant transcript entry with the given cached context.
 *
 * @param {number} cached - Cache-read tokens of the turn.
 * @param {boolean} isSidechain - Whether the turn belongs to a subagent.
 * @returns {unknown} - Transcript entry.
 */
export const assistantTurn = (
  cached: number,
  isSidechain = false,
): unknown => ({
  type: 'assistant',
  isSidechain,
  message: {
    usage: {
      input_tokens: 10,
      cache_read_input_tokens: cached,
      cache_creation_input_tokens: 500,
    },
  },
})
