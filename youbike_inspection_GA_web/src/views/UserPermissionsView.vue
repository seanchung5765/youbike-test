<template>
  <main class="flex-1 overflow-y-auto p-6 md:p-12 bg-[#f8fafc] custom-scrollbar min-h-full">
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform -translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showToast" class="fixed top-10 left-0 right-0 z-[100] flex justify-center pointer-events-none">
        <div class="bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700">
          <div class="bg-green-500 rounded-full p-1">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <span class="font-bold text-lg">設定已更新成功</span>
        </div>
      </div>
    </transition>

    <div class="max-w-6xl mx-auto">
      <div class="mb-10 flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-black text-slate-800 tracking-tight">人員權限管理</h2>
          <p class="text-slate-400 font-medium mt-1">管理各營運處的人員計分與後臺存取角色</p>
        </div>
      </div>

      <div class="bg-white p-8 rounded-[2rem] card-shadow border border-slate-100 mb-8">
        <div class="flex flex-col md:flex-row gap-6 items-end">
          <div class="flex-1 w-full relative">
            <label class="input-label">查詢或新增人員工號</label>
            <div class="relative group">
              <input 
                type="text" 
                v-model="searchId" 
                @input="filterUsers"
                @focus="showSuggestions = true"
                @blur="hideSuggestionsWithDelay"
                @keyup.enter="lookupUser" 
                class="w-full pl-14 pr-4 py-5 rounded-2xl border-2 border-slate-100 group-hover:border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-50/50 outline-none text-2xl font-mono transition-all shadow-inner bg-slate-50/50 focus:bg-white" 
                placeholder="輸入工號或姓名..."
              >
              <span class="absolute left-5 top-5.5 text-2xl group-focus-within:scale-110 transition">🔍</span>
            </div>

            <ul v-if="showSuggestions && filteredUsers.length > 0" 
                class="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto ring-4 ring-black/5">
              <li v-for="user in filteredUsers" :key="user.empId" 
                  @mousedown="selectUser(user)"
                  class="px-6 py-4 hover:bg-orange-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center transition-colors">
                <div>
                  <span class="font-black text-slate-900 text-xl">{{ user.empId }}</span>
                  <span class="ml-4 text-slate-700 font-black text-xl">{{ user.name }}</span>
                </div>
                <span class="text-slate-300 font-bold">⏎</span>
              </li>
            </ul>
          </div>
          <button @click="lookupUser" 
            class="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-12 py-5 rounded-2xl font-black text-xl transition-all active:scale-95 shadow-lg shadow-slate-200">
            帶入資料
          </button>
        </div>
      </div>

      <transition 
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 transform translate-y-4"
        enter-to-class="opacity-100 transform translate-y-0"
      >
        <div v-if="showEditor" class="space-y-6 mb-12">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="bg-white p-8 rounded-[2rem] card-shadow border border-slate-100 relative overflow-hidden">
              <h3 class="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
                <span class="w-2 h-6 bg-orange-500 rounded-full"></span> 1. 單位設定
              </h3>
              <div class="space-y-6">
                <div class="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">目前選取人員</label>
                  <div class="text-3xl font-black text-slate-900 mt-1">{{ userData.name }}</div>
                  <div class="text-sm font-mono font-bold text-orange-600">{{ userData.empId }}</div>
                </div>
                <div class="space-y-4">
                  <select v-model="selectedRegion" @change="selectedUnit = ''" class="w-full bg-white border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-orange-500 transition cursor-pointer">
                    <option value="">選擇營運處</option>
                    <option v-for="(data, key) in regionData" :key="key" :value="key">{{ data.label }}</option>
                  </select>

                  <select v-model="selectedUnit" :disabled="!selectedRegion" class="w-full bg-white border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-orange-500 transition disabled:bg-slate-50 disabled:text-slate-300 cursor-pointer">
                    <option value="">選擇地區</option>
                    <option v-for="unit in regionData[selectedRegion]?.cities" :key="unit.value" :value="unit.value">
                      {{ unit.label }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="bg-white p-8 rounded-[2rem] card-shadow border border-slate-100">
              <h3 class="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
                <span class="w-2 h-6 bg-blue-500 rounded-full"></span> 2. 前臺計分角色
              </h3>
              <div class="grid grid-cols-1 gap-3">
                <label v-for="role in frontRoles" :key="role.value" 
                  class="flex items-center p-5 rounded-2xl border-2 border-slate-50 hover:border-blue-100 cursor-pointer transition-all group"
                  :class="{'bg-blue-50 border-blue-500 shadow-md': selectedFrontRole === role.value}"
                >
                  <input type="radio" :value="role.value" v-model="selectedFrontRole" class="w-6 h-6 text-blue-600 focus:ring-0">
                  <span class="ml-4 font-black text-xl text-slate-700 group-hover:text-blue-700">{{ role.label }}</span>
                </label>
              </div>
            </div>

            <div class="bg-white p-8 rounded-[2rem] card-shadow border border-slate-100 flex flex-col">
              <h3 class="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
                <span class="w-2 h-6 bg-purple-500 rounded-full"></span> 3. 後臺系統權限
              </h3>
              <div class="flex-1">
                <select v-model="selectedBackRole" class="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl font-black text-2xl outline-none focus:border-purple-500 shadow-inner cursor-pointer">
                  <option value="">-- 請選擇 --</option>
                  <option v-for="role in backRoles" :key="role.value" :value="role.value">{{ role.label }}</option>
                </select>
                <div class="mt-6 p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p class="text-sm text-slate-500 leading-relaxed font-bold">
                    💡 <span class="text-slate-800">提示：</span>管理員權限包含所有報表匯出與系統參數調整。
                  </p>
                </div>
              </div>
              <div class="mt-8 pt-6 border-t border-slate-50 space-y-3">
                <button @click="submitRole" class="w-full py-5 bg-orange-600 hover:bg-orange-700 text-white font-black text-2xl rounded-2xl shadow-xl shadow-orange-100 transition-all active:scale-95">儲存權限設定</button>
                <button @click="showEditor = false" class="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition">取消返回</button>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <div class="bg-white rounded-[2rem] card-shadow border border-slate-100 overflow-hidden">
        <div class="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 class="font-black text-slate-800 text-xl tracking-tight uppercase">已配置權限的人員名單</h3>
          <div class="text-right">
            <span class="text-xs font-black text-slate-400 block uppercase tracking-widest">符合條件人數</span>
            <span class="text-3xl font-black text-slate-900">{{ filteredList.length }}</span>
          </div>
        </div>

        <div class="p-6 bg-white border-b border-slate-50 flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px]">
            <input 
              v-model="listQuery" 
              type="text" 
              placeholder="搜尋清單中的姓名或工號..." 
              class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-orange-500 outline-none transition"
            />
          </div>
          
          <select v-model="filterRegion" class="px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-orange-500 font-bold">
            <option value="">所有營運處</option>
            <option v-for="(data, key) in regionData" :key="key" :value="key">{{ data.label }}</option>
          </select>

          <select v-model="filterBackRole" class="px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-orange-500 font-bold">
            <option value="">所有後台角色</option>
            <option v-for="role in backRoles" :key="role.value" :value="role.value">{{ role.label }}</option>
          </select>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="px-10 py-6 text-slate-400 font-black text-xs uppercase tracking-widest">姓名與工號</th>
                <th class="px-10 py-6 text-slate-400 font-black text-xs uppercase tracking-widest">所屬單位</th>
                <th class="px-10 py-6 text-slate-400 font-black text-xs uppercase tracking-widest">角色配置 (前 / 後)</th>
                <th class="px-10 py-6 text-slate-400 font-black text-xs uppercase tracking-widest text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="user in filteredList" :key="user.empId" class="hover:bg-slate-50/80 transition-colors group">
                <td class="px-10 py-8">
                  <div class="font-black text-slate-900 text-xl">{{ user.name }}</div>
                  <div class="text-sm font-mono font-bold text-orange-600 mt-1">{{ user.empId }}</div>
                </td>
                <td class="px-10 py-8">
                  <div class="text-lg font-bold text-slate-700">{{ formatRegion(user.region) }}</div>
                  <div class="text-sm font-medium text-slate-400">{{ formatUnit(user.region, user.unit) }}</div>
                </td>
                <td class="px-10 py-8">
                  <div class="flex items-center gap-3">
                    <span class="role-badge badge-front">{{ formatFrontRole(user.frontRole) }}</span>
                    <span class="role-badge badge-back">{{ formatBackRole(user.backRole) }}</span>
                  </div>
                </td>
                <td class="px-10 py-8 text-right space-x-4">
                  <button @click="editFromList(user)" class="bg-white border-2 border-slate-100 hover:border-orange-500 hover:text-orange-600 px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-sm">
                    編輯
                  </button>
                  <button @click="deletePermission(user)" class="text-red-600 hover:text-red-800 font-black text-sm transition-colors">
                    刪除
                  </button>
                </td>
              </tr>
              <tr v-if="filteredList.length === 0">
                <td colspan="4" class="px-10 py-20 text-center text-slate-400 font-bold">
                  查無符合條件的人員
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

// --- 狀態定義 ---
const searchId = ref('');
const showEditor = ref(false);
const showToast = ref(false);
const showSuggestions = ref(false);
const userData = ref({ name: '', empId: '' });
const selectedRegion = ref('');
const selectedUnit = ref('');
const selectedFrontRole = ref('');
const selectedBackRole = ref('');

// 篩選用變數
const listQuery = ref('');      
const filterRegion = ref('');   
const filterBackRole = ref(''); 

const userList = ref([]);
const allSyncUsers = ref([]);
const filteredUsers = ref([]);

// --- 靜態資料 ---
const regionData = {
  "STAFF": { 
    label: "幕僚", 
    cities: [{ label: "不分區", value: "ALL" }] 
  },
  "NORTH": { 
    label: "北營處", 
    cities: [{ label: "雙北", value: "TAIPEI_NEW_TAIPEI" }] 
  },
  "TAO_YUN_MIAO": { 
    label: "桃竹苗營處", 
    cities: [
      { label: "桃園", value: "TAOYUAN" },
      { label: "新竹", value: "HSINCHU" },
      { label: "苗栗", value: "MIAOLI" }
    ] 
  },
  "CENTRAL": { 
    label: "中營處", 
    cities: [
      { label: "臺中", value: "TAICHUNG" },
      { label: "嘉義", value: "CHIAYI" }
    ] 
  },
  "SOUTH": { 
    label: "南營處", 
    cities: [
      { label: "台南", value: "TAINAN" },
      { label: "高雄", value: "KAOHSIUNG" },
      { label: "屏東", value: "PINGTUNG" },
      { label: "台東", value: "TAITUNG" }
    ] 
  }
};

const frontRoles = [
  { label: "執行專員", value: "SPEC" },
  { label: "營運處", value: "REG_OFFICE" },
  { label: "其他", value: "OTHER" }
];

const backRoles = [
  { label: "管理員", value: "ADMIN" },
  { label: "營運處管理", value: "REGION_MGR" },
  { label: "營運處閱覽", value: "REGION_VIEWER" },
  { label: "無角色", value: "NONE" }
];

// --- 工具函式 ---
const formatRegion = (code) => regionData[code]?.label || code || '未設定';
const formatUnit = (regionKey, unitValue) => {
  if (!regionKey || !unitValue) return "未設定";
  const region = regionData[regionKey];
  const city = region?.cities.find(c => c.value === unitValue);
  return city ? city.label : unitValue;
};
const formatFrontRole = (code) => frontRoles.find(r => r.value === code)?.label || code || '未設定';
const formatBackRole = (code) => backRoles.find(r => r.value === code)?.label || code || '未設定';

// --- 核心篩選邏輯 ---
const filteredList = computed(() => {
  return userList.value.filter(user => {
    const matchesQuery = user.name.includes(listQuery.value) || 
                         user.empId.toUpperCase().includes(listQuery.value.toUpperCase());
    const matchesRegion = filterRegion.value === '' || user.region === filterRegion.value;
    const matchesRole = filterBackRole.value === '' || user.backRole === filterBackRole.value;
    return matchesQuery && matchesRegion && matchesRole;
  });
});

// --- API 方法 ---

const refreshUserList = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/all-permissions');
    if (res.ok) {
      const data = await res.json();
      userList.value = data
        .filter(item => item.org_region && item.back_role !== 'NONE' && item.back_role !== null)
        .map(item => ({
          name: item.emp_name,
          empId: item.emp_id,
          region: item.org_region,
          unit: item.org_city,
          frontRole: item.front_role,
          backRole: item.back_role
        }));
    }
  } catch (e) { console.error("載入清單失敗:", e); }
};

const loadAllSyncUsers = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/all-sync-data');
    if (res.ok) {
      const data = await res.json();
      allSyncUsers.value = data.map(u => ({ empId: u.emp_id, name: u.emp_name }));
    }
  } catch (e) { console.error("載入同步資料失敗:", e); }
};

const filterUsers = () => {
  const query = searchId.value.trim().toUpperCase();
  if (!query) { filteredUsers.value = []; showSuggestions.value = false; return; }
  filteredUsers.value = allSyncUsers.value
    .filter(u => u.empId.includes(query) || u.name.includes(query))
    .slice(0, 10);
  showSuggestions.value = filteredUsers.value.length > 0;
};

const hideSuggestionsWithDelay = () => setTimeout(() => { showSuggestions.value = false; }, 200);

const selectUser = (user) => {
  searchId.value = user.empId;
  showSuggestions.value = false;
  lookupUser();
};

const lookupUser = async () => {
  if (!searchId.value) return;
  const targetId = searchId.value.toUpperCase();
  try {
    const res = await fetch(`http://localhost:3000/api/users/${targetId}`);
    if (res.ok) {
      const data = await res.json();
      userData.value = { name: data.name, empId: data.empId };
      if (data.savedData) {
        selectedRegion.value = data.savedData.org_region || '';
        selectedUnit.value = data.savedData.org_city || '';
        selectedFrontRole.value = data.savedData.front_role || '';
        selectedBackRole.value = data.savedData.back_role || '';
      } else {
        resetSelection();
      }
      showEditor.value = true;
    } else { alert("查無此工號"); }
  } catch (e) { alert("伺服器連線失敗"); }
};

const submitRole = async () => {
  if (!selectedRegion.value || !selectedUnit.value || !selectedFrontRole.value || !selectedBackRole.value) {
    alert("請完整填寫所有設定");
    return;
  }
  const payload = {
    empId: userData.value.empId,
    region: selectedRegion.value,
    city: selectedUnit.value,
    frontRole: selectedFrontRole.value,
    backRole: selectedBackRole.value
  };
  try {
    const res = await fetch('http://localhost:3000/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast.value = true;
      showEditor.value = false;
      searchId.value = '';
      await refreshUserList();
      setTimeout(() => { showToast.value = false; }, 2500);
    }
  } catch (e) { alert("儲存失敗"); }
};

const editFromList = (user) => {
  userData.value = { name: user.name, empId: user.empId };
  selectedRegion.value = user.region || '';
  selectedUnit.value = user.unit || '';
  selectedFrontRole.value = user.frontRole || '';
  selectedBackRole.value = user.backRole || '';
  showEditor.value = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const deletePermission = async (user) => {
  if (!confirm(`確定要移除「${user.name}」的權限嗎？`)) return;
  const payload = { 
    empId: user.empId, 
    region: null, 
    city: null, 
    frontRole: null, 
    backRole: 'NONE' 
  };
  try {
    const res = await fetch('http://localhost:3000/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      await refreshUserList();
      showToast.value = true;
      setTimeout(() => { showToast.value = false; }, 2000);
    }
  } catch (e) { alert("移除失敗"); }
};

const resetSelection = () => {
  selectedRegion.value = '';
  selectedUnit.value = '';
  selectedFrontRole.value = '';
  selectedBackRole.value = '';
};

onMounted(() => {
  refreshUserList();
  loadAllSyncUsers();
});
</script>

<style scoped>
.role-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 95px;
    padding: 8px 14px;
    border-radius: 12px;
    font-weight: 800;
    font-size: 0.95rem;
    letter-spacing: 0.5px;
    border: 1.5px solid transparent;
    transition: all 0.2s;
}
.badge-front { background-color: #eff6ff; color: #2563eb; border-color: #dbeafe; }
.badge-back { background-color: #faf5ff; color: #9333ea; border-color: #f3e8ff; }
.input-label {
    font-size: 0.85rem;
    font-weight: 900;
    color: #64748b;
    letter-spacing: 1px;
    margin-bottom: 0.5rem;
    display: block;
    text-transform: uppercase;
}
.card-shadow {
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
}
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #ea580c; border-radius: 10px; }
</style>