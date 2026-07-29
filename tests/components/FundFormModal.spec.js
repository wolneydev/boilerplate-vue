import { reactive } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import FundFormModal from '@/modules/planning/components/FundFormModal.vue'

const existing = {
  id: 10,
  project_id: 7,
  name: 'General Fund',
  total_balance: '250.00',
  allocated_balance: '125.50',
  available_balance: '124.50',
}

const makeStore = () =>
  reactive({
    getters: { 'funds/isSaving': false },
    dispatch: vi.fn().mockResolvedValue(existing),
  })

const mountModal = (props = {}, store = makeStore()) => ({
  store,
  wrapper: mount(FundFormModal, {
    props: {
      open: true,
      projectId: 7,
      fund: null,
      funds: [existing],
      currency: 'BRL',
      ...props,
    },
    global: {
      provide: { store },
      stubs: { FundBalanceSummary: true },
    },
  }),
})

describe('FundFormModal', () => {
  it('rejects duplicate names case-insensitively before dispatch', async () => {
    const { wrapper, store } = mountModal()
    await wrapper.get('#fund-name').setValue('general fund')
    await wrapper.get('#fund-total').setValue('100.00')
    await wrapper.get('form').trigger('submit')

    expect(store.dispatch).not.toHaveBeenCalled()
    expect(wrapper.text()).toMatch(/unique/i)
  })

  it('prevents reducing a total below the allocated balance', async () => {
    const { wrapper, store } = mountModal({ fund: existing })
    await wrapper.get('#fund-total').setValue('125.49')
    await wrapper.get('form').trigger('submit')

    expect(store.dispatch).not.toHaveBeenCalled()
    expect(wrapper.text()).toMatch(/lower than.*allocated/i)
  })

  it('dispatches one canonical create request and emits saved', async () => {
    const { wrapper, store } = mountModal({ funds: [] })
    await wrapper.get('#fund-name').setValue('  New Fund  ')
    await wrapper.get('#fund-total').setValue('001000,50')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(store.dispatch).toHaveBeenCalledWith('funds/createFund', {
      projectId: 7,
      payload: { name: 'New Fund', opening_balance: '1000.50' },
    })
    expect(wrapper.emitted('saved')).toHaveLength(1)
  })

  it('preserves input and maps server field errors', async () => {
    const store = makeStore()
    store.dispatch.mockRejectedValue(
      Object.assign(new Error('Invalid fund.'), {
        data: { errors: { name: ['Name is already in use.'] } },
      }),
    )
    const { wrapper } = mountModal({ funds: [] }, store)
    await wrapper.get('#fund-name').setValue('Candidate')
    await wrapper.get('#fund-total').setValue('10.00')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('#fund-name').element.value).toBe('Candidate')
    expect(wrapper.text()).toContain('Name is already in use.')
  })
})
