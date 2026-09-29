import { parseTime, shiftTime } from './timeInput'

describe('parseTime', () => {
  it.each([
    ['9', '09:00'],
    ['930', '09:30'],
    ['0930', '09:30'],
    ['9:30', '09:30'],
    ['9.5', '09:50'],
    ['21h15', '21:15'],
    ['23:59', '23:59'],
    [' 14:05 ', '14:05'],
  ])('reads %s as %s', (input, out) => expect(parseTime(input)).toBe(out))

  it.each(['24:00', '12:60', '9pm', '', 'abc', '12345'])('rejects %s', (input) =>
    expect(parseTime(input)).toBeNull(),
  )
})

describe('shiftTime', () => {
  it('moves minutes and wraps around midnight', () => {
    expect(shiftTime('09:55', 5)).toBe('10:00')
    expect(shiftTime('00:00', -5)).toBe('23:55')
  })
})
