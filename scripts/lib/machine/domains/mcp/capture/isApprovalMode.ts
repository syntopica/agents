import type { ApprovalMode } from '../types/ApprovalMode'

export const isApprovalMode = (value: unknown): value is ApprovalMode =>
  value === 'auto' ||
  value === 'prompt' ||
  value === 'writes' ||
  value === 'approve'
