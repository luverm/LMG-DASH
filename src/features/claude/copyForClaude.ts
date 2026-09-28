const CLAUDE_NEW_CHAT = 'https://claude.ai/new'

/**
 * Copies a ready-made prompt and opens a new Claude chat, so the work runs on the
 * user's own subscription. The app itself never calls an AI API.
 */
export async function copyForClaude(prompt: string): Promise<boolean> {
  let copied = false
  try {
    await navigator.clipboard.writeText(prompt)
    copied = true
  } catch {
    // Clipboard blocked (e.g. insecure context); the caller shows the prompt instead.
  }
  window.open(CLAUDE_NEW_CHAT, '_blank', 'noopener,noreferrer')
  return copied
}
