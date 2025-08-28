import { useUser } from '@clerk/clerk-expo';

const ADMIN_ROLE = 'org:admin';

export function useUserRole() {
  const { user } = useUser();
  const membership = user?.organizationMemberships[0];
  const role = membership?.role;
  const permissions = membership?.permissions || [];
  const isAdmin = role === ADMIN_ROLE;
  return { role, permissions, isAdmin };
}
