import outputSchema from '../../schemas/guidance-reconciliation.schema.json'
import { toGuidanceInputHashes } from './toGuidanceInputHashes'
import type { GuidancePolicy } from './types/GuidancePolicy'
import type { GuidanceSources } from './types/GuidanceSources'

export const buildReconciliationPrompt = (
  policy: GuidancePolicy,
  sources: GuidanceSources,
): string =>
  JSON.stringify({
    task: 'Reconcile public agent guidance without filesystem writes.',
    constraints: [
      'Use live web search to retrieve at least one current official Claude Code page and one current official Codex page on every run. Use only URLs under the supplied officialDocumentationOrigins.',
      'Make separate web searches whose query text literally includes "Claude" or "Anthropic" for Claude documentation and "Codex" or "OpenAI" for Codex documentation, so each provider search is independently auditable.',
      'Immediately before the final response, obtain the current UTC time and use that full ISO-8601 timestamp for every documentation retrievedAt value.',
      'Return only JSON conforming to the supplied output schema.',
      'Do not emit credentials, conversation captures, or paths outside the guidance surface.',
      'Translate provider syntax into documented target behavior; Codex output must not retain Claude imports.',
      'Include every requiredInvariants string verbatim in shared, claudeDocument, and codexDocument. Do not paraphrase or omit these strings.',
      'Preserve the semantic union of both live targets, canonical sources, and relevant rules. Keep provider-neutral behavior in shared and provider-specific behavior only in its overlay.',
    ],
    requiredInvariants: policy.requiredInvariants,
    officialDocumentationOrigins: policy.officialDocumentationOrigins,
    outputSchema,
    inputHashes: toGuidanceInputHashes(sources.hashes),
    sources: sources.values,
  })
