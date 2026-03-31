function permissionManager() {
    return {
        searchId: '', // 綁定輸入框
        showEditor: false, 
        showToast: false,
        userData: { name: '', empId: '' }, // 儲存 LDAP 回傳的人員資訊
        selectedRegion: '', 
        selectedUnit: '', 
        selectedFrontRole: '', 
        selectedBackRole: '',
        
        // 1. 初始化：進入頁面先讀取現有的 SQL 權限名單
        async init() {
        await this.refreshUserList();
        },

        // 取得所有人員列表 API
        async refreshUserList() {
        try {
            const res = await fetch('http://localhost:3000/api/users');
            if (res.ok) {
            this.userList = await res.json();
            }
        } catch (e) {
            console.error("無法載入名單，請確認後端 Server 是否啟動");
        }
        },

        // 2. 帶入人員資料：連線後端 LDAP 查詢
        async lookupUser() {
        if (!this.searchId) return;
        try {
            // 發送員編給後端進行 LDAP 搜尋
            const res = await fetch(`http://localhost:3000/api/users/${this.searchId.toUpperCase()}`);
            
            if (res.ok) {
            const data = await res.json();
            // data 包含從 LDAP 抓到的 name，以及 SQL 若有紀錄的權限
            this.userData = { name: data.name, empId: data.empId };
            this.selectedRegion = data.region || '';
            this.selectedUnit = data.unit || '';
            this.selectedFrontRole = data.frontRole || '';
            this.selectedBackRole = data.backRole || '';
            this.showEditor = true;
            } else {
            alert("LDAP 系統查無此員編，請重新確認");
            }
        } catch (e) {
            alert("連線失敗！請檢查後端 API 網址是否正確");
        }
        },

        // 3. 儲存設定：將權限同步回 SQL
        async submitRole() {
        const payload = {
            empId: this.userData.empId,
            name: this.userData.name, // 包含 LDAP 帶入的姓名
            region: this.selectedRegion,
            unit: this.selectedUnit,
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
            await this.refreshUserList(); // 儲存後立即更新下方列表
            setTimeout(() => { this.showToast = false; }, 2500);
            }
        } catch (e) {
            alert("儲存過程發生錯誤");
        }
        },

        // 列表編輯功能：快速帶入資料到編輯區
        editFromList(user) {
        this.userData = { name: user.name, empId: user.empId };
        this.selectedRegion = user.region;
        this.selectedUnit = user.unit;
        this.selectedFrontRole = user.frontRole;
        this.selectedBackRole = user.backRole;
        this.showEditor = true;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    }