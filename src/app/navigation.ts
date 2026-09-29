import type { ShapeKind } from '@/components/shapes/shapes'

export interface NavItem {
  label: string
  to: string
  shape: ShapeKind
  color?: string
}

/** Top bar tabs. Add one here when adding a top-level route in routes.tsx. */
export const navItems: NavItem[] = [
  { label: 'Today', to: '/', shape: 'circle' },
  { label: 'Projects', to: '/projects', shape: 'hexagon', color: 'var(--butter)' },
  { label: 'Solutions', to: '/solutions', shape: 'square', color: 'var(--lime)' },
  { label: 'History', to: '/history', shape: 'square' },
]
