document.addEventListener("alpine:init", () => {
  Alpine.data("permissionPage", () => ({
    configs: {
      roleMappings: [],
      unitConfigs: []
    },

    form: {
      ldap_group_dn: "",
      role_id: "VIEWER"
    },

    loading: false,
    saving: false,
    message: "",
    error: "",

    async init() {
      await this.loadConfigs();
    },

    async loadConfigs() {
      this.loading = true;
      this.message = "";
      this.error = "";

      try {
        const res = await fetch("/api/admin/config", {
          credentials: "include"
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.msg || "讀取設定失敗");
        }

        this.configs = {
          roleMappings: Array.isArray(data.roleMappings) ? data.roleMappings : [],
          unitConfigs: Array.isArray(data.unitConfigs) ? data.unitConfigs : []
        };
      } catch (err) {
        console.error("loadConfigs error:", err);
        this.error = err.message || "無法載入設定";
      } finally {
        this.loading = false;
      }
    },

    async saveRoleMapping() {
      this.message = "";
      this.error = "";

      const ldap_group_dn = this.form.ldap_group_dn.trim();
      const role_id = this.form.role_id;

      if (!ldap_group_dn || !role_id) {
        this.error = "請填寫 LDAP Group DN 與角色";
        return;
      }

      this.saving = true;

      try {
        const res = await fetch("/api/admin/config/role", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            ldap_group_dn,
            role_id
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.msg || "儲存失敗");
        }

        this.message = data.msg || "儲存成功";
        this.form.ldap_group_dn = "";
        this.form.role_id = "VIEWER";

        await this.loadConfigs();
      } catch (err) {
        console.error("saveRoleMapping error:", err);
        this.error = err.message || "儲存失敗";
      } finally {
        this.saving = false;
      }
    },

    async removeRoleMapping(ldapGroupDn) {
      this.error = "";
      this.message = "";

      const target = String(ldapGroupDn || "").trim();
      if (!target) return;

      if (!window.confirm(`確定要移除這筆 LDAP 群組映射嗎？\n${target}`)) {
        return;
      }

      try {
        const nextMappings = this.configs.roleMappings.filter(
          (item) => item.ldap_group_dn !== target
        );

        const res = await fetch("/api/admin/config/all", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            roleMappings: nextMappings,
            unitConfigs: this.configs.unitConfigs
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.msg || "移除失敗");
        }

        this.message = data.msg || "已移除";
        await this.loadConfigs();
      } catch (err) {
        console.error("removeRoleMapping error:", err);
        this.error = err.message || "移除失敗";
      }
    }
  }));
});