import { describe, expect, it } from 'vitest'
import {
  INSUFFICIENT_FUNDS,
  decimalToMinorUnits,
  formatDateOnly,
  formatMoney,
  formatRecordedAt,
  getCurrencyFractionDigits,
  isInsufficientFundsError,
  normalizeDecimalString,
  validateMoneyAmount,
} from '@/modules/planning/types/finances.types'

describe('financial domain helpers', () => {
  it('derives standard currency precision', () => {
    expect(getCurrencyFractionDigits('BRL')).toBe(2)
    expect(getCurrencyFractionDigits('JPY')).toBe(0)
    expect(() => getCurrencyFractionDigits()).toThrow('valid project currency')
  })

  it('normalizes decimal input without floating point conversion', () => {
    expect(normalizeDecimalString('001250,50')).toBe('1250.50')
    expect(normalizeDecimalString('0.25')).toBe('0.25')
    expect(normalizeDecimalString('1.2.3')).toBeNull()
  })

  it('converts exact decimals to minor-unit BigInts', () => {
    expect(decimalToMinorUnits('9007199254740993.25', 2)).toBe(900719925474099325n)
    expect(() => decimalToMinorUnits('1.234', 2)).toThrow('currency precision')
  })

  it('validates positivity, precision, and available balance exactly', () => {
    expect(validateMoneyAmount('', { currency: 'BRL' })).toContain('required')
    expect(validateMoneyAmount('10')).toContain('currency is unavailable')
    expect(validateMoneyAmount('0', { currency: 'BRL' })).toContain('greater than zero')
    expect(validateMoneyAmount('1.234', { currency: 'BRL' })).toContain('2 decimal')
    expect(
      validateMoneyAmount('9007199254740993.26', {
        currency: 'BRL',
        availableBalance: '9007199254740993.25',
      }),
    ).toContain('available balance')
    expect(
      validateMoneyAmount('9007199254740993.25', {
        currency: 'BRL',
        availableBalance: '9007199254740993.25',
      }),
    ).toBeNull()
  })

  it('formats large decimal strings without changing their digits', () => {
    const formatted = formatMoney('9007199254740993.25', 'BRL', 'pt-BR')
    expect(formatted).toContain('9.007.199.254.740.993,25')
    expect(formatted).toContain('R$')
    expect(formatMoney('10.00')).toBe('—')
  })

  it('formats date-only values without timezone conversion', () => {
    expect(formatDateOnly('2026-07-26')).toBe('26/07/2026')
  })

  it('formats recorded timestamps in the requested local timezone', () => {
    const formatted = formatRecordedAt('2026-07-26T15:30:00Z', 'pt-BR', 'UTC')
    expect(formatted).toContain('26/07/2026')
    expect(formatted).toContain('15:30')
  })

  it('recognizes only the stable insufficient-funds code', () => {
    expect(
      isInsufficientFundsError({ data: { code: INSUFFICIENT_FUNDS } }),
    ).toBe(true)
    expect(isInsufficientFundsError({ message: INSUFFICIENT_FUNDS })).toBe(false)
  })
})
