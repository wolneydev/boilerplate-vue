import httpClient from '@/core/http/httpClient'
import { normalizeDecimalString } from '@/modules/planning/types/finances.types'

const unwrap = (data) => data?.data ?? data

// Task allocation contract:
//   POST /api/tasks/{taskId}/financial-allocations
//        { task_id, fund_id, amount } -> { data: TaskAllocation }
// actor_user_id is security-sensitive and must be supplied by the authenticated
// backend context when it constructs FinancialAllocationData.
// Errors are normalized by the shared client; INSUFFICIENT_FUNDS remains in error.data.code.
export const allocationsService = {
  async create(taskId, payload) {
    const { data } = await httpClient.post(
      `/tasks/${taskId}/financial-allocations`,
      {
        task_id: Number(taskId),
        fund_id: Number(payload.fund_id),
        amount: normalizeDecimalString(payload.amount),
      },
    )
    return unwrap(data)
  },
}
