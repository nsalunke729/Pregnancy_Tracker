import { describe, it, expect } from 'vitest'
import { toCSV } from '@/lib/csv'

describe('toCSV', () => {
  it('joins headers and rows with commas and CRLF', () => {
    const csv = toCSV(['Date', 'Mood'], [['2024-01-01', 'Good'], ['2024-01-02', 'Okay']])
    expect(csv).toBe('Date,Mood\r\n2024-01-01,Good\r\n2024-01-02,Okay')
  })

  it('quotes a cell containing a comma', () => {
    const csv = toCSV(['Symptoms'], [['Nausea, Headache']])
    expect(csv).toBe('Symptoms\r\n"Nausea, Headache"')
  })

  it('quotes and escapes a cell containing a double quote', () => {
    const csv = toCSV(['Notes'], [['She said "fine"']])
    expect(csv).toBe('Notes\r\n"She said ""fine"""')
  })

  it('quotes a cell containing a newline', () => {
    const csv = toCSV(['Notes'], [['line one\nline two']])
    expect(csv).toBe('Notes\r\n"line one\nline two"')
  })

  it('renders null and undefined as empty cells', () => {
    const csv = toCSV(['A', 'B'], [[null, undefined]])
    expect(csv).toBe('A,B\r\n,')
  })

  it('does not quote plain numbers or words', () => {
    const csv = toCSV(['Water'], [[5]])
    expect(csv).toBe('Water\r\n5')
  })
})
