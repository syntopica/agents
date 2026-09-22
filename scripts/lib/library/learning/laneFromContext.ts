import { LANE_DIRECTIVE_MARKERS } from './constants/LANE_DIRECTIVE_MARKERS'

export const laneFromContext = (context: string | undefined) => {
  if (context === undefined) {
    return undefined
  }

  for (const [lane, marker] of Object.entries(LANE_DIRECTIVE_MARKERS)) {
    if (context.includes(marker)) {
      return lane
    }
  }

  return undefined
}
