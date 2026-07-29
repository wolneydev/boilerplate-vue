const TelegramSettingsPage = () => import('@/modules/settings/pages/TelegramSettingsPage.vue')

export default [
  {
    path: '/settings/telegram',
    name: 'TelegramSettings',
    component: TelegramSettingsPage,
    meta: { requiresAuth: true },
  },
]
