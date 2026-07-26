import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AllocationHistoryList from '@/modules/planning/components/AllocationHistoryList.vue'

const allocations = [
  {
    id: 2,
    fund_name: 'Contingency',
    amount: '20.00',
    recorded_at: '2026-07-26T15:30:00Z',
  },
  {
    id: 1,
    fund_name: 'General Fund',
    amount: '10.50',
    recorded_at: '2026-07-25T12:00:00Z',
  },
]

describe('AllocationHistoryList', () => {
  it('preserves backend order and displays source, money, and local timestamp', () => {
    const wrapper = mount(AllocationHistoryList, {
      props: { items: allocations, currency: 'BRL' },
    })
    const rows = wrapper.findAll('tbody tr')

    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Contingency')
    expect(rows[0].text()).toMatch(/20[,.]00/)
    expect(rows[1].text()).toContain('General Fund')
    expect(rows[0].text()).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })

  it('renders loading, empty, and error states distinctly', async () => {
    const wrapper = mount(AllocationHistoryList, {
      props: { items: [], currency: 'BRL', loading: true },
    })
    expect(wrapper.text()).toMatch(/loading/i)

    await wrapper.setProps({ loading: false })
    expect(wrapper.text()).toMatch(/no allocations/i)

    await wrapper.setProps({ error: 'History unavailable.' })
    expect(wrapper.text()).toContain('History unavailable.')
  })
})
