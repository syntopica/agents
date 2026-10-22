export const signalReconciliationProcessGroup = (
  ownedGroupId: number,
  signal: NodeJS.Signals | 0,
): boolean => {
  try {
    process.kill(-ownedGroupId, signal)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH') return false
    throw error
  }
}
