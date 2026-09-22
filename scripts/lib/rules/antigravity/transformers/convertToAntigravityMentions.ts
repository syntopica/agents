/**
 * Convert relative rule references to Antigravity
 * @mentions
 * @param {string} content - Rule content
 * @param {string} _currentPath - Current rule file path
 * @returns {string} - Content with converted references
 */
export function convertToAntigravityMentions(
  content: string,
  _currentPath: string,
) {
  const converted = content.replace(/\.cursor\/rules\//g, '.agent/rules/')
  return converted
}
