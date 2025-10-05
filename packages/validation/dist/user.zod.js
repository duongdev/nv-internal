"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zChangeUserPassword = exports.zUserPublicMetadata = exports.zCreateUser = exports.UserRole = void 0;
const zod_1 = require("./zod");
exports.UserRole = {
    nvInternalAdmin: 'nv_internal_admin',
    nvInternalWorker: 'nv_internal_worker',
};
exports.zCreateUser = zod_1.z.object({
    firstName: zod_1.z
        .string()
        .trim()
        .min(2, 'Tên phải có ít nhất 2 ký tự')
        .max(100, 'Tên phải có tối đa 100 ký tự')
        .optional(),
    lastName: zod_1.z.string().trim().max(100, 'Tên phải có tối đa 100 ký tự'),
    email: zod_1.z.union([zod_1.z.literal(''), zod_1.z.email()]),
    phone: zod_1.z
        .string()
        .trim()
        .length(10, 'Số điện thoại phải có 10 chữ số')
        .regex(/^0\d+$/, 'Số điện thoại không hợp lệ'),
    username: zod_1.z
        .string()
        .trim()
        .min(2, 'Tên đăng nhập phải có ít nhất 2 ký tự')
        .max(100, 'Tên đăng nhập phải có tối đa 100 ký tự')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Tên đăng nhập không hợp lệ'),
    password: zod_1.z
        .union([
        zod_1.z.literal(''),
        zod_1.z.string().trim().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    ])
        .optional(),
});
exports.zUserPublicMetadata = zod_1.z.object({
    phoneNumber: zod_1.z.string().trim().optional(),
    roles: zod_1.z.array(zod_1.z.enum(exports.UserRole)),
    defaultPasswordChanged: zod_1.z.boolean().default(false),
});
exports.zChangeUserPassword = zod_1.z
    .object({
    currentPassword: zod_1.z
        .string()
        .min(1, 'Vui lòng nhập mật khẩu hiện tại')
        .max(100),
    newPassword: zod_1.z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').max(100),
    confirmPassword: zod_1.z
        .string()
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
        .max(100),
})
    .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
});
