<template>
  <div class="bg-slate-50 flex flex-col h-screen overflow-hidden font-sans">
    <header class="h-16 bg-slate-800 text-white flex items-center justify-between px-4 shadow-md z-40 border-b-4 border-orange-600 flex-shrink-0">
      <div class="flex items-center space-x-4">
        <button @click="sidebarOpen = !sidebarOpen" class="p-2 rounded-md hover:bg-orange-600 transition">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div class="text-xl font-black tracking-wider text-orange-500">
          YouBike1.0<span class="text-white">模擬體驗後台</span>
        </div>
      </div>

      <div class="relative" @mouseenter="clearMenuTimer" @mouseleave="startMenuTimer">
        <button @click="userMenuOpen = !userMenuOpen" class="flex items-center space-x-2 hover:opacity-80 transition">
          <div class="text-right hidden sm:block">
            <p class="font-bold text-sm leading-tight">{{ user.name }}</p>
            <p class="text-[10px] text-orange-400 font-mono">{{ user.role }}</p>
          </div>
          <div class="w-9 h-9 rounded-full bg-orange-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
            </svg>
          </div>
        </button>
          <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <div
                v-if="userMenuOpen"
                class="absolute right-0 mt-2 w-48 bg-white border rounded shadow-xl py-1 z-50 text-slate-800 ring-1 ring-black ring-opacity-5"
              >
                <button
                  @click="logout"
                  class="w-full text-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  登出系統
                </button>
              </div>
            </transition>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden relative">
      <div v-if="sidebarOpen" @click="sidebarOpen = false" class="lg:hidden absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-40"></div>

      <aside :class="sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-0'" 
             class="bg-slate-900 text-slate-300 shadow-2xl z-30 transform transition-all duration-300 ease-in-out overflow-y-auto flex-shrink-0">
        <nav class="p-4 space-y-1 w-72">
          <p class="text-[10px] text-slate-500 uppercase font-bold px-3 mt-4 mb-2 tracking-widest">業務分析報表</p>
          <a href="#" @click.prevent="router.push('/HomeView/SearchView')" class="block px-4 py-3 rounded-lg hover:bg-slate-800 transition">首頁 / 數據查詢</a>
          
          <div v-if="user.role === 'ADMIN'">
            <p class="text-[10px] text-slate-500 uppercase font-bold px-3 mt-8 mb-2 tracking-widest">管理控制台</p>
            <a href="#" @click.prevent="router.push('/HomeView/UserPermissionsView')" class="block px-4 py-3 rounded-lg hover:bg-slate-800 transition text-orange-400 font-bold">👤 權限控制</a>
          </div>
        </nav>
      </aside>

      <main class="flex-1 bg-white overflow-y-auto p-0">
        <RouterView /> 
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, RouterView } from 'vue-router';

const router = useRouter();
const sidebarOpen = ref(true); 
const userMenuOpen = ref(false);
const user = ref({ name: '讀取中...', role: 'USER' });

let menuTimer = null;
const startMenuTimer = () => { menuTimer = setTimeout(() => { userMenuOpen.value = false; }, 500); };
const clearMenuTimer = () => { if (menuTimer) { clearTimeout(menuTimer); menuTimer = null; } };

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/me', { credentials: 'include' });
    const data = await res.json();
    // 判定管理員邏輯
    const isAdmin = data.user?.username === 'GB5765' || data.user?.role === 'ADMIN'; 
    user.value = {
      name: data.user?.cn || '使用者',
      role: isAdmin ? 'ADMIN' : (data.user?.role || 'USER').toUpperCase()
    };
  } catch (err) {
    user.value = { name: '開發模式', role: 'ADMIN' };
  }
});

const logout = () => { if (confirm("確定要登出嗎？")) router.push('/'); };
</script>