export const renderGuidanceDocument = (
  shared: string,
  overlay: string,
): string =>
  `${shared.trimEnd()}\n\n${overlay.trimStart()}`.replace(
    'Render the shared guidance plus this overlay into',
    'Render this document into',
  )
