"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_validator_1 = require("@hono/zod-validator");
const validation_1 = require("@nv-internal/validation");
const hono_1 = require("hono");
const http_exception_1 = require("hono/http-exception");
const auth_1 = require("../middlewares/auth");
const user_service_1 = require("./user.service");
const router = new hono_1.Hono()
    // Get current user
    .get('/me', (c) => {
    const user = (0, auth_1.getAuthUserStrict)(c);
    return c.json(user);
})
    // Create a new user
    .post('/', (0, zod_validator_1.zValidator)('json', validation_1.zCreateUser), async (c) => {
    const data = c.req.valid('json');
    const user = (0, auth_1.getAuthUserStrict)(c);
    const clerkClient = c.get('clerk');
    const canCreateUser = (0, user_service_1.canUserCreateUser)({ user });
    if (!canCreateUser) {
        throw new http_exception_1.HTTPException(403, {
            message: 'Bạn không có quyền tạo người dùng.',
            cause: 'Permission denied',
        });
    }
    try {
        const user = await (0, user_service_1.createClerkUser)({ clerkClient, data });
        c.status(201);
        return c.json(user);
    }
    catch (error) {
        throw new http_exception_1.HTTPException(500, {
            message: 'Không thể tạo người dùng.',
            cause: error,
        });
    }
})
    // Get all users
    .get('/', async (c) => {
    const user = (0, auth_1.getAuthUserStrict)(c);
    const clerkClient = c.get('clerk');
    if (!(await (0, user_service_1.canUserListUsers)({ user }))) {
        throw new http_exception_1.HTTPException(403, {
            message: 'Bạn không có quyền xem danh sách người dùng.',
            cause: 'Permission denied',
        });
    }
    const users = await (0, user_service_1.getAllUsers)({ clerkClient });
    return c.json(users);
})
    // Ban/unban user
    .put('/:id/ban', (0, zod_validator_1.zValidator)('param', validation_1.z.object({ id: validation_1.z.string() })), (0, zod_validator_1.zValidator)('json', validation_1.z.object({ ban: validation_1.z.boolean() })), async (c) => {
    const user = (0, auth_1.getAuthUserStrict)(c);
    const clerkClient = c.get('clerk');
    const { id: userId } = c.req.valid('param');
    const { ban } = c.req.valid('json');
    if (!(await (0, user_service_1.canUserBanUnbanUser)({ user }))) {
        throw new http_exception_1.HTTPException(403, {
            message: 'Bạn không có quyền khoá người dùng.',
            cause: 'Permission denied',
        });
    }
    const updatedUser = ban
        ? await (0, user_service_1.banUser)({ clerkClient, userId })
        : await (0, user_service_1.unbanUser)({ clerkClient, userId });
    return c.json(updatedUser);
})
    // Update roles
    .put('/:id/roles', (0, zod_validator_1.zValidator)('param', validation_1.z.object({ id: validation_1.z.string() })), (0, zod_validator_1.zValidator)('json', validation_1.z.object({
    roles: validation_1.z.array(validation_1.z.enum(validation_1.UserRole)),
})), async (c) => {
    const user = (0, auth_1.getAuthUserStrict)(c);
    const clerkClient = c.get('clerk');
    const { id: userId } = c.req.valid('param');
    const { roles } = c.req.valid('json');
    if (!(await (0, user_service_1.canUserUpdateUserRoles)({ user }))) {
        throw new http_exception_1.HTTPException(403, {
            message: 'Bạn không có quyền cập nhật vai trò người dùng.',
            cause: 'Permission denied',
        });
    }
    const updatedUser = await (0, user_service_1.updateUserRoles)({ clerkClient, userId, roles });
    return c.json(updatedUser);
})
    // Get a user by id (public info)
    .get('/:id/public-info', (0, zod_validator_1.zValidator)('param', validation_1.z.object({ id: validation_1.z.string() })), async (c) => {
    (0, auth_1.getAuthUserStrict)(c);
    const clerkClient = c.get('clerk');
    const { id: userId } = c.req.valid('param');
    const user = await clerkClient.users.getUser(userId);
    if (!user) {
        throw new http_exception_1.HTTPException(404, {
            message: 'Người dùng không tồn tại.',
            cause: 'Not found',
        });
    }
    return c.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        banned: user.banned,
        publicMetadata: user.publicMetadata,
        imageUrl: user.imageUrl,
        hasImage: user.hasImage,
    });
});
exports.default = router;
