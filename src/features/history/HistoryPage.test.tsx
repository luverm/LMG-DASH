import { screen } from '@testing-library/react'
import { newDay, startWork, pause, closeDay } from '@/features/workday/day'
import { defaultSettings } from '@/features/workday/types'
import { renderApp, testData } from '@/test/renderApp'

describe('History', () => {
  it('lists past days with totals and their summary', async () => {
    const data = testData()
    let day = newDay('2026-09-01', defaultSettings)
    day = startWork(day, new Date('2026-09-01T09:00:00'))
    day = pause(day, new Date('2026-09-01T11:30:00'))
    day = closeDay(
      day,
      new Date('2026-09-01T17:00:00'),
      { done: 'Shipped the export', next: 'Tests' },
      {},
    )
    data.engine.set(data.paths.day(day.date), day)
    await data.engine.flush()

    renderApp('/history', data)
    expect(await screen.findByText('Shipped the export')).toBeInTheDocument()
    expect(screen.getByText('2h 30m')).toBeInTheDocument()
    expect(screen.getByText('Tests')).toBeInTheDocument()
  })

  it('shows an empty state before any tracking', async () => {
    renderApp('/history')
    expect(await screen.findByText(/Your past days will show up here/)).toBeInTheDocument()
  })
})
