export interface NavItem {
  label: string
  to: string
}

/** Sidebar entries. Add one here when adding a top-level route in routes.tsx. */
export const navItems: NavItem[] = [{ label: 'Overview', to: '/' }]
