import { suggestNewBlock, validateDrafts, type Draft } from './drafts'

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

describe('suggestNewBlock', () => {
  it('fills up to an hour at the end of the latest free gap', () => {
    expect(suggestNewBlock([d('a', '09:00', '10:00'), d('b', '13:00', '14:00')], '23:59')).toEqual({
      start: '22:59',
      end: '23:59',
    })
    // Today at 14:30: the gap after "b" is only 30 minutes, which still fits.
    expect(suggestNewBlock([d('a', '09:00', '10:00'), d('b', '13:00', '14:00')], '14:30')).toEqual({
      start: '14:00',
      end: '14:30',
    })
  })

  it('goes before a running block when that is where the room is', () => {
    expect(suggestNewBlock([d('a', '11:00', '', true)], '11:05')).toEqual({
      start: '10:00',
      end: '11:00',
    })
  })

  it('uses the time before a block that started just after midnight only if it fits', () => {
    // 01:44 running since 01:44: 00:00–01:44 is free.
    expect(suggestNewBlock([d('a', '01:44', '', true)], '01:45')).toEqual({
      start: '00:44',
      end: '01:44',
    })
    // Nothing free: the running block covers the whole morning so far.
    expect(suggestNewBlock([d('a', '00:00', '', true)], '00:10')).toBeNull()
  })
})
