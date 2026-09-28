import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dateKey } from '@/lib/time'
import { renderApp } from '@/test/renderApp'

describe('Today', () => {
  it('plans the day, works on an item, and closes the day with a summary', async () => {
    const user = userEvent.setup()
    const { data } = renderApp('/')

    expect(await screen.findByText(/Let's plan your day/)).toBeInTheDocument()
    await user.type(screen.getByLabelText('New plan item'), 'Review PRs')
    await user.selectOptions(screen.getByLabelText('Estimate'), '60')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await user.type(screen.getByLabelText('New plan item'), 'Write docs{Enter}')
    expect(screen.getByText('1h planned of 8h')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Start my day' }))
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Start "Review PRs"' }))
    expect(screen.getByText('Working on')).toBeInTheDocument()
    expect(screen.getByText('Now')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mark "Review PRs" as done' }))
    await user.click(screen.getByRole('button', { name: 'Close day' }))

    const dialog = screen.getByRole('dialog', { name: 'Close your workday' })
    expect(within(dialog).getByLabelText('Done today')).toHaveValue('• Review PRs')
    expect(within(dialog).getByLabelText(/Next up/)).toHaveValue('Write docs')
    await user.click(within(dialog).getByRole('button', { name: 'Close day' }))

    expect(await screen.findByText('Your wrap-up')).toBeInTheDocument()
    await data.engine.flush()
    const saved = await data.engine.load<{ status: string; summary: { next: string } }>(
      data.paths.day(dateKey(new Date())),
    )
    expect(saved?.status).toBe('closed')
    expect(saved?.summary.next).toBe('Write docs')
  })

  it('takes a break from the break menu', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await user.click(await screen.findByRole('button', { name: 'Just start' }))
    await user.click(screen.getByRole('button', { name: /Break/ }))
    await user.click(screen.getByRole('menuitem', { name: 'Lunch' }))
    expect(screen.getByText('Lunch break')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back to work' })).toBeInTheDocument()
  })
})
