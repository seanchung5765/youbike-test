<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6">
    <div class="w-full max-w-md">
      <div class="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-slate-200 p-8">
        <div class="flex items-center gap-3 w-full">
          <div class="flex-1">
            <h1 class="text-3xl font-semibold text-slate-900 text-center">
              YouBike1.0 模擬體驗後台
            </h1>
          </div>
        </div>

        <div class="mt-6 space-y-4">
          <div>
            <label class="text-sm font-medium text-slate-700">帳號</label>
            <input v-model="username" type="text" autocomplete="username"
              class="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-400"
              placeholder="GB1234" />
          </div>

          <div>
            <label class="text-sm font-medium text-slate-700">密碼</label>
            <div class="relative mt-1">
              <input v-model="password" :type="passwordVisible ? 'text' : 'password'" autocomplete="current-password"
                class="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-400"
                placeholder="••••••••" />
              <button type="button" @mousedown="passwordVisible = true" @mouseup="passwordVisible = false"
                @mouseleave="passwordVisible = false" class="absolute inset-y-0 right-3 flex items-center text-slate-500">
                {{ passwordVisible ? '🙈' : '👁' }}
              </button>
            </div>
          </div>

          <button :disabled="isLoading" @click="handleLogin"
            class="w-full rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 active:bg-slate-950 transition disabled:opacity-50">
            {{ isLoading ? '登入中...' : '登入' }}
          </button>

          <p class="text-sm text-rose-600 min-h-[20px]">{{ errorMsg }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const passwordVisible = ref(false)
const isLoading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ""
  if (!username.value || !password.value) {
    errorMsg.value = "請輸入帳號與密碼"
    return
  }
  isLoading.value = true
  try {
    const res = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", 
      body: JSON.stringify({ username: username.value, password: password.value }),
    })

    if (res.ok) {
      // 💡 關鍵：路徑必須與 router/index.js 的 path 完全一致 (大小寫)
      router.push('/HomeView'); 
    } else {
      errorMsg.value = "登入失敗（帳號或密碼不正確）"
    }
  } catch (e) {
    errorMsg.value = "連線失敗，請確認後端有啟動"
  } finally {
    isLoading.value = false
  }
}
</script>