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
    await user.click(screen.getByRole('link', { name: '← Solutions' }))
    const card = await screen.findByRole('link', { name: /Invoice export/ })
    expect(within(card).getByText('Live')).toBeInTheDocument()
    expect(screen.getByText('live')).toBeInTheDocument()
  })
})
