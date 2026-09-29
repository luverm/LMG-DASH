import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'

describe('Solutions page', () => {
  it('documents a solution from a delivered project and lists it', async () => {
    const user = userEvent.setup()
    renderApp('/projects')

    await user.click(await screen.findByRole('button', { name: 'Wish' }))
    const dialog = screen.getByRole('dialog', { name: 'New wish' })
    await user.type(within(dialog).getByLabelText("What's the wish?"), 'Invoice export')
    await user.click(within(dialog).getByRole('button', { name: 'Save and open' }))

    await user.click(screen.getByRole('radio', { name: 'Delivered' }))
    await user.click(screen.getByRole('button', { name: 'Document the solution' }))

    expect(await screen.findByRole('link', { name: '← Solutions' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Invoice export')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Invoice export' })).toBeInTheDocument() // linked project

    await user.click(screen.getByRole('radio', { name: 'Live' }))

    // A once-a-year event: 16 hours per year.
    await user.type(screen.getByLabelText('Hours saved'), '16')
    await user.tab()
    await user.selectOptions(screen.getByLabelText('Per'), 'year')
    expect(screen.getByLabelText('Hours saved')).toHaveValue('16')

    await user.click(screen.getByRole('link', { name: '← Solutions' }))
    expect(await screen.findByText('saved per year')).toBeInTheDocument()
    expect(screen.getByText('~16h per year')).toBeInTheDocument()

    // The sum is shown: 16h per year × 1 = 16h, and the total.
    const table = screen.getByRole('table', { name: 'How the yearly total is calculated' })
    expect(within(table).getByText('16h per year')).toBeInTheDocument()
    expect(within(table).getByText('× 1')).toBeInTheDocument()
    expect(within(table).getByRole('rowheader', { name: 'Total per year' })).toBeInTheDocument()
    const card = (await screen.findAllByRole('link', { name: /Invoice export/ })).at(-1)!
    expect(within(card).getByText('Live')).toBeInTheDocument()
    expect(screen.getByText('live')).toBeInTheDocument()
  })
})
