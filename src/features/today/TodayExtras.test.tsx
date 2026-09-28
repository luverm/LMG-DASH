import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dateKey } from '@/lib/time'
import { renderApp } from '@/test/renderApp'

describe('Today extras', () => {
  it('uses keyboard shortcuts for the clock and breaks', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await user.click(await screen.findByRole('button', { name: 'Just start' }))
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()

    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument()
    await user.keyboard('b')
    expect(screen.getByText('Coffee break')).toBeInTheDocument()
    await user.keyboard('b')
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()

    await user.keyboard('?')
    expect(screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeInTheDocument()
  })

  it('edits blocks and keeps scratchpad notes', async () => {
    const user = userEvent.setup()
    const { data } = renderApp('/')
    await user.click(await screen.findByRole('button', { name: 'Just start' }))

    await user.type(screen.getByLabelText('Scratchpad'), 'Call Anna back')
    await user.tab()

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    const dialog = screen.getByRole('dialog', { name: /Edit times/ })
    await user.click(within(dialog).getByRole('button', { name: 'Add block' }))
    const breakRadios = within(dialog).getAllByRole('radio', { name: 'Break' })
    await user.click(breakRadios.at(-1)!)
    // The new block starts where the running one starts, so it overlaps: fix by deleting the running one.
    const deletes = within(dialog).getAllByRole('button', { name: 'Delete block' })
    await user.click(deletes[0])
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    await data.engine.flush()
    const day = data.engine.peek<{ notes?: string; segments: { kind: string }[] }>(
      data.paths.day(dateKey(new Date())),
    )
    expect(day?.notes).toBe('Call Anna back')
    expect(day?.segments.map((s) => s.kind)).toEqual(['break'])
  })

  it('starts and ends the focus timer', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await user.click(await screen.findByRole('button', { name: 'Just start' }))
    await user.click(screen.getByRole('button', { name: 'Focus timer 25/5' }))
    expect(screen.getByText('Focus · cycle 1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'End focus' }))
    expect(screen.getByRole('button', { name: 'Focus timer 25/5' })).toBeInTheDocument()
  })
})
