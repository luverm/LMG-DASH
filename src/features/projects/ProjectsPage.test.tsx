import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'

describe('Projects', () => {
  it('captures a wish from the top bar, opens it and adds it to today', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/projects')

    expect(await screen.findByText(/When a coworker brings you a problem/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Wish' }))
    const dialog = screen.getByRole('dialog', { name: 'New wish' })
    await user.type(within(dialog).getByLabelText("What's the wish?"), 'Invoice export')
    await user.type(within(dialog).getByLabelText('From whom'), 'Anna')
    await user.click(within(dialog).getByRole('button', { name: 'Save and open' }))

    expect(router.state.location.pathname).toMatch(/^\/projects\/.+/)
    expect(screen.getByDisplayValue('Invoice export')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Exploring' }))
    expect(screen.getByRole('radio', { name: 'Exploring' })).toHaveAttribute('aria-checked', 'true')

    // Awaiting feedback shows the phase and offers to ask for feedback.
    await user.click(screen.getByRole('radio', { name: 'Awaiting feedback' }))
    expect(screen.getByText('since today')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ask for feedback' })).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Exploring' }))

    await user.type(screen.getByLabelText('New note'), 'Also needs CSV')
    await user.click(screen.getByRole('button', { name: 'Add note' }))
    expect(screen.getByText('Also needs CSV')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: "Add to today's plan" }))
    expect(screen.getByRole('button', { name: "In today's plan" })).toBeDisabled()

    await user.click(screen.getByRole('link', { name: 'Projects' }))
    expect(await screen.findByRole('heading', { name: /Exploring/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Invoice export/ })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Today' }))
    // The plan item carries the project tag.
    const row = (await screen.findByRole('button', { name: 'Invoice export' })).closest('li')!
    expect(within(row).getByText('Invoice export', { selector: 'span' })).toBeInTheDocument()
  })
})
