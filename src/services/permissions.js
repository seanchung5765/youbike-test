// permissions.js
function permissionManager() {
    return {
        // --- 核心狀態 ---
        searchId: '', 
        showEditor: false, 
        showToast: false,
        userData: { name: '', empId: '' }, 
        selectedRegion: '', 
        selectedUnit: '', 
        selectedFrontRole: '', 
        selectedBackRole: '',
        userList: [], 

        // --- 🔍 關鍵字查詢相關狀態 ---
        showSuggestions: false, 
        filteredUsers: [],      
        allSyncUsers: [],       

        // --- UI 選單定義 ---
        regionData: {
            "北營處": ["臺北市", "新北市", "桃園市", "新竹市"],
            "中營處": ["臺中市", "彰化縣", "南投縣"],
            "南營處": ["嘉義市", "臺南市", "高雄市", "屏東縣"]
        },
        frontRoles: ["維修員", "調度員", "巡檢員", "客服員"],
        backRoles: ["系統管理員", "營運主管", "一般查詢帳號"],

        // --- 初始化 ---
        async init() {
            console.log("前端初始化，正在載入權限清單與同步人員...");
            try {
                await Promise.all([
                    this.refreshUserList(),
                    this.loadAllSyncUsers()
                ]);
            } catch (e) {
                console.error("初始化失敗:", e);
            }
        },

        // --- 🟢 取得所有已設定權限的人員清單 (下方表格) ---
        async refreshUserList() {
            try {
                const res = await fetch('http://localhost:3000/api/all-permissions'); 
                if (res.ok) {
                    const data = await res.json();
                    
                    // 使用 .filter 篩選掉區域與角色皆為空的人員
                    this.userList = data
                        .filter(item => item.org_region || item.front_role || item.back_role)
                        .map(item => ({
                            name: item.emp_name,
                            empId: item.emp_id,
                            region: item.org_region || '未設定',
                            unit: item.org_city || '未設定',
                            frontRole: item.front_role || '未設定',
                            backRole: item.back_role || '未設定'
                        }));
                }
            } catch (e) {
                console.error("載入列表失敗:", e);
            }
        },

        // --- 🟢 取得下拉建議用的全量名單 ---
        async loadAllSyncUsers() {
            try {
                const res = await fetch('http://localhost:3000/api/all-sync-data'); 
                if (res.ok) {
                    const data = await res.json();
                    this.allSyncUsers = data.map(u => ({
                        empId: u.emp_id,
                        name: u.emp_name 
                    }));
                }
            } catch (e) {
                console.error("無法載入建議名單:", e);
            }
        },

        // --- 🟢 處理輸入時的關鍵字過濾 ---
        filterUsers() {
            const query = this.searchId.trim().toUpperCase();
            if (!query) {
                this.filteredUsers = [];
                this.showSuggestions = false;
                return;
            }
            this.filteredUsers = this.allSyncUsers.filter(user => 
                user.empId.includes(query) || user.name.includes(query)
            ).slice(0, 10); 
            this.showSuggestions = this.filteredUsers.length > 0;
        },

        // --- 🟢 從建議選單點選人員 ---
        selectUser(user) {
            this.searchId = user.empId;
            this.showSuggestions = false;
            this.lookupUser(); 
        },

        // --- 🟢 查詢工號 (LDAP 同步/資料庫讀取) ---
        async lookupUser() {
            if (!this.searchId) return;
            const targetId = this.searchId.toUpperCase();
            this.showSuggestions = false; 

            try {
                const res = await fetch(`http://localhost:3000/api/users/${targetId}`);
                if (res.ok) {
                    const data = await res.json();
                    this.userData = { name: data.name, empId: data.empId };
                    
                    if (data.savedData) {
                        this.selectedRegion = data.savedData.org_region || '';
                        this.selectedUnit = data.savedData.org_city || '';
                        this.selectedFrontRole = data.savedData.front_role || '';
                        this.selectedBackRole = data.savedData.back_role || '';
                    } else {
                        this.resetSelection();
                    }
                    this.showEditor = true;
                } else {
                    alert("查無此員編，請確認工號是否正確");
                }
            } catch (e) {
                alert("伺服器連線失敗");
            }
        },

        // --- 🟢 儲存權限至資料庫 ---
        async submitRole() {
            // 檢查是否所有選單都有選擇
            if (!this.selectedRegion || !this.selectedUnit || !this.selectedFrontRole || !this.selectedBackRole) {
                alert("請填寫完整的區域、城市與角色設定");
                return;
            }

            const payload = {
                empId: this.userData.empId,
                name: this.userData.name,
                region: this.selectedRegion,
                city: this.selectedUnit,
                frontRole: this.selectedFrontRole,
                backRole: this.selectedBackRole
            };

            try {
                const res = await fetch('http://localhost:3000/api/permissions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    this.showToast = true;
                    this.showEditor = false;
                    this.searchId = ''; 
                    await this.refreshUserList(); // 儲存成功後刷新列表
                    setTimeout(() => { this.showToast = false; }, 2500);
                } else {
                    alert("儲存失敗");
                }
            } catch (e) {
                alert("網路連線錯誤");
            }
        },

        // --- 🟢 刪除權限 ---
        // --- 🟢 移除權限 (保留人員，僅清空設定) ---
        async deletePermission(user) {
            if (!confirm(`確定要移除「${user.name}」的權限設定嗎？`)) return;

            // 準備空權限資料
            const payload = {
                empId: user.empId,
                name: user.name,
                region: '', // 清空
                city: '',   // 清空
                frontRole: '', // 清空
                backRole: ''   // 清空
            };

            try {
                // 使用原本儲存權限的 API，但傳送空值進去覆蓋
                const res = await fetch('http://localhost:3000/api/permissions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    // 成功後重新讀取清單，該人員會因為權限為空而被過濾掉
                    await this.refreshUserList(); 
                    this.showToast = true;
                    setTimeout(() => { this.showToast = false; }, 2000);
                } else {
                    alert("移除失敗");
                }
            } catch (e) {
                alert("連線錯誤");
            }
        },

        // --- 🟢 編輯功能 ---
        editFromList(user) {
            this.userData = { name: user.name, empId: user.empId };
            this.selectedRegion = user.region === '未設定' ? '' : user.region;
            this.selectedUnit = user.unit === '未設定' ? '' : user.unit;
            this.selectedFrontRole = user.frontRole === '未設定' ? '' : user.frontRole;
            this.selectedBackRole = user.backRole === '未設定' ? '' : user.backRole;
            this.showEditor = true;
            // 捲動到上方編輯區
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        // --- 重置選擇狀態 ---
        resetSelection() {
            this.selectedRegion = '';
            this.selectedUnit = '';
            this.selectedFrontRole = '';
            this.selectedBackRole = '';
        }
    };
}