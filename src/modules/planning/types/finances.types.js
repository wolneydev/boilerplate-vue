// Financial domain contracts and exact decimal/date helpers.

/**
 * @typedef {Object} ProjectFund
 * @property {number} id
 * @property {number} project_id
 * @property {string} name
 * @property {string} total_balance
 * @property {string} allocated_balance
 * @property {string} available_balance
 */

/**
 * @typedef {Object} ProjectCost
 * @property {number} id
 * @property {number} project_id
 * @property {string} amount
 * @property {string} description
 * @property {string} incurred_on
 * @property {string} recorded_at
 */

/**
 * @typedef {Object} TaskAllocation
 * @property {number} id
 * @property {number} task_id
 * @property {number} fund_id
 * @property {string} fund_name
 * @property {string} amount
 * @property {string} recorded_at
 */

export const INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS'

const normalizeCurrencyCode = (currency) => {
  const code = typeof currency === 'string' ? currency.trim().toUpperCase() : ''
  if (!/^[A-Z]{3}$/.test(code)) {
    throw new RangeError('A valid project currency code is required.')
  }
  return code
}

export const getCurrencyFractionDigits = (currency, locale = 'en') => {
  const currencyCode = normalizeCurrencyCode(currency)
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).resolvedOptions().maximumFractionDigits
}

export const normalizeDecimalString = (value) => {
  if (value == null) return null
  let normalized = String(value).trim()
  if (!normalized) return null
  if (normalized.includes(',') && !normalized.includes('.')) {
    normalized = normalized.replace(',', '.')
  }
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null

  const [integer, fraction] = normalized.split('.')
  const canonicalInteger = integer.replace(/^0+(?=\d)/, '') || '0'
  return fraction == null ? canonicalInteger : `${canonicalInteger}.${fraction}`
}

export const decimalToMinorUnits = (value, fractionDigits) => {
  const normalized = normalizeDecimalString(value)
  if (!normalized) throw new Error('A valid decimal amount is required.')

  const [integer, fraction = ''] = normalized.split('.')
  if (fraction.length > fractionDigits) {
    throw new Error(`Amount exceeds currency precision of ${fractionDigits} decimal places.`)
  }

  const paddedFraction = fraction.padEnd(fractionDigits, '0')
  return BigInt(`${integer}${paddedFraction}`)
}

export const validateMoneyAmount = (
  value,
  { currency, availableBalance = null } = {},
) => {
  if (value == null || String(value).trim() === '') return 'Amount is required.'

  const normalized = normalizeDecimalString(value)
  if (!normalized) return 'Enter a valid numeric amount.'

  let fractionDigits
  try {
    fractionDigits = getCurrencyFractionDigits(currency)
  } catch {
    return 'The project currency is unavailable. Update the project before entering amounts.'
  }
  const fraction = normalized.split('.')[1] ?? ''
  if (fraction.length > fractionDigits) {
    return `Amount supports at most ${fractionDigits} decimal places.`
  }

  const minorUnits = decimalToMinorUnits(normalized, fractionDigits)
  if (minorUnits <= 0n) return 'Amount must be greater than zero.'

  if (
    availableBalance != null &&
    minorUnits > decimalToMinorUnits(availableBalance, fractionDigits)
  ) {
    return 'Amount exceeds the available balance.'
  }

  return null
}

export const formatMoney = (value, currency, locale) => {
  const normalized = normalizeDecimalString(value)
  if (!normalized) return '—'

  let fractionDigits
  try {
    fractionDigits = getCurrencyFractionDigits(currency, locale)
  } catch {
    return '—'
  }
  const currencyCode = normalizeCurrencyCode(currency)
  const [integer, fraction = ''] = normalized.split('.')
  if (fraction.length > fractionDigits) return '—'

  const currencyFormatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
  const parts = currencyFormatter.formatToParts(0)
  const groupedInteger = new Intl.NumberFormat(locale, {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(BigInt(integer))
  const decimal = parts.find((part) => part.type === 'decimal')?.value ?? '.'
  const numericTypes = new Set(['integer', 'group', 'decimal', 'fraction'])
  let insertedAmount = false

  return parts
    .map((part) => {
      if (!numericTypes.has(part.type)) return part.value
      if (insertedAmount) return ''
      insertedAmount = true
      const paddedFraction = fraction.padEnd(fractionDigits, '0')
      return fractionDigits
        ? `${groupedInteger}${decimal}${paddedFraction}`
        : groupedInteger
    })
    .join('')
}

export const formatDateOnly = (value) => {
  if (!value) return '—'
  const [year, month, day] = String(value).split('T')[0].split('-')
  return year && month && day ? `${day}/${month}/${year}` : String(value)
}

export const formatRecordedAt = (
  value,
  locale = 'pt-BR',
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone,
  }).format(date)
}

export const isInsufficientFundsError = (error) =>
  error?.data?.code === INSUFFICIENT_FUNDS
