"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zTaskListQuery = exports.zCreateTask = void 0;
const prisma_1 = require("./prisma");
const zod_1 = require("./zod");
exports.zCreateTask = zod_1.z.object({
    title: zod_1.z
        .string()
        .trim()
        .min(2, 'Tiêu đề quá ngắn')
        .max(100, 'Tiêu đề quá dài'),
    description: zod_1.z.string().trim(),
    customerPhone: zod_1.z.union([
        zod_1.z.literal(''),
        zod_1.z
            .string()
            .trim()
            .length(10, 'Số điện thoại phải có 10 chữ số')
            .regex(/^0\d+$/, 'Số điện thoại không hợp lệ')
            .optional(),
    ]),
    customerName: zod_1.z.string().trim().optional(),
    geoLocation: zod_1.z
        .object({
        address: zod_1.z.string().trim().optional(),
        name: zod_1.z.string().trim().optional(),
        lat: zod_1.z.number(),
        lng: zod_1.z.number(),
    })
        .optional(),
});
exports.zTaskListQuery = zod_1.z.object({
    cursor: zod_1.z.string().optional(),
    take: zod_1.z.string().optional(),
    status: zod_1.z.union([zod_1.z.enum(prisma_1.TaskStatus), zod_1.z.array(zod_1.z.enum(prisma_1.TaskStatus))]).optional(),
    assignedOnly: zod_1.z.string().optional(),
});
