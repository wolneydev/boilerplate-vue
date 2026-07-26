import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CostHistoryList from '@/modules/planning/components/CostHistoryList.vue'

const costs = [
  {
    id: 3,
    amount: '1250.50',
    description: 'Newest backend entry',
    incurred_on: '2026-07-26',
    recorded_at: '2026-07-26T15:00:00Z',
  },
  {
    id: 2,
    amount: '10.00',
    description: 'Older backend entry',
    incurred_on: '2026-07-25',
    recorded_at: '2026-07-25T15:00:00Z',
  },
]

describe('CostHistoryList', () => {
  it('shows a loading state', () => {
    const wrapper = mount(CostHistoryList, {
      props: { costs: [], currency: 'USD', loading: true },
    })

    expect(wrapper.text()).toContain('Loading cost history...')
  })

  it('shows a distinct unavailable state', () => {
    const wrapper = mount(CostHistoryList, {
      props: { costs: [], currency: 'USD', error: 'Cost history is unavailable.' },
    })

    expect(wrapper.text()).toContain('Cost history is unavailable.')
  })

  it('shows an empty state', () => {
    const wrapper = mount(CostHistoryList, {
      props: { costs: [], currency: 'USD' },
    })

    expect(wrapper.text()).toContain('No costs have been registered for this project.')
  })

  it('formats amounts and date-only values without changing backend order', () => {
    const wrapper = mount(CostHistoryList, {
      props: { costs, currency: 'USD' },
    })
    const rows = wrapper.findAll('[data-testid="cost-row"]')

    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Newest backend entry')
    expect(rows[1].text()).toContain('Older backend entry')
    expect(rows[0].text()).toContain('$1,250.50')
    expect(rows[0].text()).toContain('26/07/2026')
    expect(rows[0].text()).not.toContain('25/07/2026')
  })
})
