const ldap = require('ldapjs');

async function getAllLdapUsers() {
    return new Promise((resolve, reject) => {
        const client = ldap.createClient({ url: process.env.LDAP_URL });

        client.bind(process.env.LDAP_DN, process.env.LDAP_PASSWORD, (err) => {
            if (err) {
                console.error('❌ LDAP 管理員綁定失敗:', err.message);
            } else {
                console.log('✅ LDAP 管理員綁定成功');
            }

            const attrName = process.env.LDAP_USER_ATTR || 'uid';
            const searchOptions = {
                scope: 'sub',
                filter: '(|(objectClass=person)(objectClass=user)(objectClass=organizationalPerson))', 
                attributes: [attrName, 'cn', 'displayName', 'sAMAccountName']
            };

            console.log(`🔎 正在掃描 BaseDN: ${process.env.LDAP_BASE_DN}`);

            client.search(process.env.LDAP_BASE_DN, searchOptions, (err, res) => {
                if (err) { client.destroy(); return reject(err); }

                const users = [];
                res.on('searchEntry', (entry) => {
                    // 💡 修正處：改用 entry.object 並處理陣列值
                    const u = entry.object; 
                    if (!u) return;

                    const getVal = (val) => Array.isArray(val) ? val[0] : val;

                    const username = getVal(u[attrName]) || getVal(u.sAMAccountName) || getVal(u.uid);
                    const cn = getVal(u.displayName) || getVal(u.cn) || '未命名';

                    if (username) {
                        users.push({
                            username: username.toString().toUpperCase().trim(),
                            cn: cn.toString().trim()
                        });
                    }
                });

                res.on('error', (err) => {
                    client.destroy();
                    reject(err);
                });

                res.on('end', () => {
                    console.log(`ℹ️ LDAP 掃描完成，共找到 ${users.length} 位使用者`);
                    client.unbind();
                    resolve(users);
                });
            });
        });
    });
}

const authenticateWithLdap = (username, password) => {
    return new Promise((resolve) => {
        const client = ldap.createClient({ url: process.env.LDAP_URL });
        const userAttr = process.env.LDAP_USER_ATTR || 'uid';
        const userDN = `${userAttr}=${username},cn=users,${process.env.LDAP_BASE_DN}`;

        client.bind(userDN, password, (err) => {
            client.destroy();
            if (err) {
                resolve(null);
            } else {
                resolve({ username: username.toUpperCase() });
            }
        });
    });
};

module.exports = { authenticateWithLdap, getAllLdapUsers };