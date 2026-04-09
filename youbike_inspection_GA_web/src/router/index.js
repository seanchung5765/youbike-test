import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue' 
import HomeView from '../views/HomeView.vue' 

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'LoginView',
      component: LoginView
    },
    {
      path: '/HomeView',
      name: 'HomeView',
      component: HomeView,
      // 💡 進入首頁自動重定向到與檔案同名的路徑
      redirect: '/HomeView/SearchView', 
      children: [
        {
          // 💡 路徑現在完全對應檔案名稱 SearchView.vue
          path: 'SearchView',
          name: 'SearchView',
          component: () => import('../views/SearchView.vue')
        },
        {
          // 💡 路徑現在完全對應檔案名稱 UserPermissionsView.vue
          path: 'UserPermissionsView',
          name: 'UserPermissionsView',
          component: () => import('../views/UserPermissionsView.vue')
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

export default router