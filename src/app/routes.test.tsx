import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from './routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('routing', () => {
  it('shows the top bar tabs', () => {
    renderAt('/')
    for (const name of ['Today', 'Projects', 'History']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument()
    }
  })

  it('renders the not-found page for unknown paths', () => {
    renderAt('/does-not-exist')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})
