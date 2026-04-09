<template>
  <div class="w-full h-full">
    <div class="p-8 border-b bg-white">
      <h1 class="text-2xl font-black text-slate-800">數據查詢首頁</h1>
      <p class="text-slate-500 text-sm">目前的網址路徑已對應檔案名稱：/HomeView/SearchView</p>
    </div>

    <div class="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="p-6 bg-orange-50 border border-orange-200 rounded-xl">
        <h3 class="font-bold text-orange-800 mb-2">快速導航</h3>
        <button @click="$router.push('/HomeView/UserPermissionsView')" class="bg-orange-600 text-white px-4 py-2 rounded shadow-md text-sm">管理人員權限</button>
      </div>
      
      <div class="p-6 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
        <p class="text-xl font-bold tracking-widest">READY TO ANALYZE</p>
        <p class="text-xs mt-1">系統數據已就緒</p>
      </div>
    </div>
  </div>
</template>