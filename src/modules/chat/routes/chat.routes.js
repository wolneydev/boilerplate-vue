const ChatPage = () => import('@/modules/chat/pages/ChatPage.vue')

export default [
  {
    path: '/chat',
    name: 'Chat',
    component: ChatPage,
    meta: { requiresAuth: true },
  },
]
