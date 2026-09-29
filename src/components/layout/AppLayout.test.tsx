import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'

describe('navigation', () => {
  // Newer Chrome returns a Promise from window.scrollTo. The scroll-to-top effect must not hand
  // that back to React as a cleanup function, or the next navigation crashes.
  it('survives a scrollTo that returns a value', async () => {
    const original = window.scrollTo
    window.scrollTo = (() => Promise.resolve()) as unknown as typeof window.scrollTo
    try {
      const user = userEvent.setup()
      renderApp('/projects')
      await user.click(await screen.findByRole('link', { name: 'History' }))
      await user.click(screen.getByRole('link', { name: 'Projects' }))
      await user.click(screen.getByRole('link', { name: 'Today' }))
      expect(await screen.findByText(/Let's plan your day/)).toBeInTheDocument()
      expect(screen.queryByText(/Unexpected Application Error/)).not.toBeInTheDocument()
    } finally {
      window.scrollTo = original
    }
  })
})
