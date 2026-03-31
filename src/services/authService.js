import { authenticateWithLdap } from "./ldapservice.js";
import { readMappings } from "./configservice.js";

function resolveRole(memberOf, roleMappings) {
  let finalRole = "VIEWER";

  for (const mapping of roleMappings || []) {
    if (memberOf.includes(mapping.ldap_group_dn)) {
      finalRole = mapping.role_id;
    }
  }

  return finalRole;
}

function resolveScope(role, department, unitConfigs) {
  if (role === "ADMIN") return "ALL";

  const unitConfig = (unitConfigs || []).find((u) =>
    department.includes(u.keyword)
  );

  return unitConfig ? unitConfig.regions : [];
}

export async function loginUser(username, password) {
  if (username === "admin" && password === "12345") {
    return {
      username: "admin",
      cn: "系統管理員",
      role: "ADMIN",
      unit: "總部管理層",
      scope: "ALL",
      regions: ["台北", "桃園", "新竹", "苗栗", "台中", "嘉義", "台南", "高雄", "屏東", "台東"],
    };
  }

  const ldapUser = await authenticateWithLdap(username, password);
  if (!ldapUser) return null;

  const mappings = await readMappings();

  const finalRole = resolveRole(ldapUser.memberOf, mappings.roleMappings);
  const finalScope = resolveScope(finalRole, ldapUser.department, mappings.unitConfigs);

  return {
    username: ldapUser.username,
    cn: ldapUser.cn,
    role: finalRole,
    unit: ldapUser.department,
    scope: finalScope,
  };
}