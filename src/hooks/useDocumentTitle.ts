import { useEffect } from 'react'

const DEFAULT_TITLE = 'LMG Dash'

function setTitle(title: string) {
  document.title = title
}

/** Sets the tab title while mounted; restores the default afterwards. */
export function useDocumentTitle(title: string | null) {
  useEffect(() => setTitle(title ?? DEFAULT_TITLE), [title])
  useEffect(() => () => setTitle(DEFAULT_TITLE), [])
}
