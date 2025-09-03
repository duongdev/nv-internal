import { z } from './zod'

export const UserRole = {
  nvInternalAdmin: 'nv_internal_admin',
  nvInternalWorker: 'nv_internal_worker',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const zCreateUser = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(100, 'Tên phải có tối đa 100 ký tự')
    .optional(),
  lastName: z.string().trim().max(100, 'Tên phải có tối đa 100 ký tự'),
  email: z.union([z.literal(''), z.email()]),
  phone: z
    .string()
    .trim()
    .length(10, 'Số điện thoại phải có 10 chữ số')
    .regex(/^0\d+$/, 'Số điện thoại không hợp lệ'),
  username: z
    .string()
    .trim()
    .min(2, 'Tên đăng nhập phải có ít nhất 2 ký tự')
    .max(100, 'Tên đăng nhập phải có tối đa 100 ký tự')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Tên đăng nhập không hợp lệ'),
  password: z
    .union([
      z.literal(''),
      z.string().trim().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    ])
    .optional(),
})

export const zUserPublicMetadata = z.object({
  phoneNumber: z.string().trim().optional(),
  roles: z.array(z.enum(UserRole)),
  defaultPasswordChanged: z.boolean().default(false),
})
export type UserPublicMetadata = z.infer<typeof zUserPublicMetadata>
