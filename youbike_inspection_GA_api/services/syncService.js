const ldapService = require('./ldapservice');
const mysql = require('mysql2/promise');

async function performFullSync() {
    console.log(`[${new Date().toISOString()}] 🔄 開始同步至 permission_settings...`);
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    try {
        const ldapUsers = await ldapService.getAllLdapUsers(); 
        
        if (!ldapUsers || ldapUsers.length === 0) {
            console.error('⚠️ 同步失敗：LDAP 未回傳任何使用者。');
            return { total: 0, added: 0 };
        }

        const ldapUsernames = ldapUsers.map(u => u.username);

        // 1. 更新或新增名單 (保護現有權限)
        const upsertSql = `
            INSERT INTO permission_settings (emp_id, emp_name, back_role) 
            VALUES (?, ?, '') 
            ON DUPLICATE KEY UPDATE emp_name = VALUES(emp_name)
        `;

        for (const user of ldapUsers) {
            await connection.execute(upsertSql, [user.username, user.cn]);
        }

        // 2. 移除不存在於 LDAP 且未設定權限的使用者
        const adminId = process.env.INITIAL_ADMIN_ID;
        await connection.query(
            `DELETE FROM permission_settings 
             WHERE emp_id NOT IN (?) 
             AND emp_id <> ? 
             AND (org_region = '' OR org_region IS NULL) 
             AND (back_role = '' OR back_role IS NULL OR back_role = 'NONE')`,
            [ldapUsernames, adminId]
        );

        console.log(`✅ 同步成功！已處理 ${ldapUsers.length} 位使用者。`);
        return { total: ldapUsers.length, added: ldapUsers.length };
    } finally {
        await connection.end();
    }
}

module.exports = { syncLdapToDb: performFullSync };