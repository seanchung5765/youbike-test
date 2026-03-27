import { Client } from "ldapts";
import "dotenv/config";

export async function authenticateWithLdap(username, password) {
  const {
    LDAP_URL,
    LDAP_DN,
    LDAP_PASSWORD,
    LDAP_BASE_DN,
    LDAP_USER_ATTR = "uid",
  } = process.env;

  const client = new Client({ url: LDAP_URL });

  try {
    await client.bind(LDAP_DN, LDAP_PASSWORD);

    const safeUsername = username.replace(/[()|&*=<>]/g, "");
    const filter = `(${LDAP_USER_ATTR}=${safeUsername})`;

    const { searchEntries } = await client.search(LDAP_BASE_DN, {
      scope: "sub",
      filter,
      attributes: ["dn", "cn", "memberOf", "department", LDAP_USER_ATTR],
    });

    if (!searchEntries?.length) return null;

    const entry = searchEntries[0];

    await client.bind(entry.dn, password);

    return {
      username,
      cn: entry.cn || username,
      memberOf: entry.memberOf || [],
      department: entry.department || "",
      dn: entry.dn,
    };
  } finally {
    await client.unbind().catch(() => {});
  }
}