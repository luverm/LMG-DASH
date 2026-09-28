import { ShapeButton } from '@/components/ui/ShapeButton'
import { useToast } from '@/components/feedback/ToastContext'
import type { ShapeKind } from '@/components/shapes/shapes'
import { copyForClaude } from './copyForClaude'

interface ClaudeButtonProps {
  prompt: () => string
  children: string
  shape?: ShapeKind
  color?: string
}

/** Copies a prompt with context and opens claude.ai in a new tab. */
export function ClaudeButton({ prompt, children, shape = 'hexagon', color }: ClaudeButtonProps) {
  const toast = useToast()
  return (
    <ShapeButton
      shape={shape}
      color={color}
      size="sm"
      variant="ghost"
      title="Copies a prompt and opens Claude in a new tab"
      onClick={async () => {
        const copied = await copyForClaude(prompt())
        toast(
          copied ? 'Copied. Paste it into Claude.' : "Couldn't copy. Check clipboard permissions.",
        )
      }}
    >
      {children}
    </ShapeButton>
  )
}
