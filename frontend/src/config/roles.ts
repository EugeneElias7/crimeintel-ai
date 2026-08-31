export type UserRole = 'OFFICER' | 'INSPECTOR' | 'ADMIN' | 'SUPER_ADMIN';

export const ROLE_LABELS: Record<UserRole, string> = {
  OFFICER: 'Police Officer',
  INSPECTOR: 'Inspector',
  ADMIN: 'Administrator',
  SUPER_ADMIN: 'Super Administrator',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  OFFICER: 'Registered police personnel - create cases, view authorized cases, upload evidence, use CRIMA AI, use analytics',
  INSPECTOR: 'Inspector - supervise investigations, manage case assignments, review evidence',
  ADMIN: 'System administration, account approval, user verification, user management, full system access',
  SUPER_ADMIN: 'Super administrator - full system access, user management, system configuration',
};

export function normalizeRole(role: string): UserRole {
  const r = (role || '').toUpperCase();
  if (r === 'POLICE_OFFICER' || r === 'OFFICER') return 'OFFICER';
  if (r === 'ADMIN' || r === 'SUPER_ADMIN') return r as UserRole;
  if (r === 'INSPECTOR') return 'INSPECTOR';
  return (r as UserRole) || 'OFFICER';
}

export function getRoleLabel(role: string): string {
  const n = normalizeRole(role);
  return ROLE_LABELS[n] || role;
}

export function getRoleDescription(role: string): string {
  const n = normalizeRole(role);
  return ROLE_DESCRIPTIONS[n] || '';
}

export function getRoleBadgeVariant(role: string): 'critical' | 'open' | 'under_investigation' | 'default' {
  const n = normalizeRole(role);
  switch (n) {
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return 'critical';
    case 'INSPECTOR':
      return 'under_investigation';
    case 'OFFICER':
      return 'open';
    default:
      return 'default';
  }
}