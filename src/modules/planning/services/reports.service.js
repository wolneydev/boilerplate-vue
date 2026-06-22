import httpClient from '@/core/http/httpClient'

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value != null),
  )

export const reportsService = {
  async show({ reportType = 'both', status = '', startDate = '', endDate = '' } = {}) {
    const { data } = await httpClient.get('/reports', {
      params: cleanParams({
        report_type: reportType,
        status,
        start_date: startDate,
        end_date: endDate,
      }),
    })

    return data?.data ?? data
  },
}
