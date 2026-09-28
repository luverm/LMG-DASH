import { validateDrafts, type Draft } from './drafts'

const d = (id: string, start: string, end: string, running = false): Draft => ({
  id,
  kind: 'work',
  focus: '',
  start,
  end,
  running,
})

describe('validateDrafts', () => {
  it('accepts sorted, non-overlapping blocks with one running at the end', () => {
    expect(
      validateDrafts('2026-09-28', [d('a', '09:00', '10:00'), d('b', '10:15', '', true)]),
    ).toEqual({})
  })

  it('flags end before start, overlaps and a running block that is not last', () => {
    expect(validateDrafts('2026-09-28', [d('a', '10:00', '09:00')])).toEqual({
      a: 'Ends before it starts',
    })
    expect(
      validateDrafts('2026-09-28', [d('a', '09:00', '10:30'), d('b', '10:00', '11:00')]),
    ).toEqual({
      b: 'Overlaps the block before it',
    })
    expect(
      validateDrafts('2026-09-28', [d('a', '09:00', '', true), d('b', '10:00', '11:00')]),
    ).toEqual({
      a: 'Only the last block can still be running',
    })
  })
})
