import { screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'

describe('routing', () => {
  it('shows the top bar tabs', async () => {
    renderApp('/')
    for (const name of ['Today', 'Projects', 'History']) {
      expect(await screen.findByRole('link', { name })).toBeInTheDocument()
    }
  })

  it('renders the not-found page for unknown paths', async () => {
    renderApp('/does-not-exist')
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})
