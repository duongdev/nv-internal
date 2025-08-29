export const UserRole = {
  nvInternalAdmin: 'nv_internal_admin',
  nvInternalWorker: 'nv_internal_worker',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]
