import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { TimeField } from './TimeField'

function Harness() {
  const [value, setValue] = useState('09:00')
  return (
    <>
      <TimeField aria-label="Start" value={value} onChange={setValue} />
      <output>{value}</output>
    </>
  )
}

describe('TimeField', () => {
  it('shows 24-hour time and accepts typed times', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByLabelText('Start')
    expect(input).toHaveValue('09:00')

    await user.click(input)
    await user.keyboard('1730')
    expect(screen.getByRole('status')).toHaveTextContent('17:30')
    await user.tab()
    expect(input).toHaveValue('17:30')

    await user.click(input)
    await user.keyboard('{ArrowUp}')
    expect(input).toHaveValue('17:35')
  })

  it('reverts text that is not a time', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByLabelText('Start')
    await user.click(input)
    await user.keyboard('99')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    await user.tab()
    expect(input).toHaveValue('09:00')
  })
})
