"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthUserStrict = exports.getAuthUser = exports.authMiddleware = void 0;
const clerk_auth_1 = require("@hono/clerk-auth");
const factory_1 = require("hono/factory");
const http_exception_1 = require("hono/http-exception");
const log_1 = require("../../lib/log");
exports.authMiddleware = (0, factory_1.createMiddleware)(async (c, next) => {
    await (0, clerk_auth_1.clerkMiddleware)()(c, () => Promise.resolve());
    const auth = (0, clerk_auth_1.getAuth)(c);
    if (!auth?.userId) {
        c.set('userId', null);
        c.set('user', null);
        return c.json({ message: 'unauthorized' }, 401);
    }
    c.set('userId', auth.userId);
    try {
        const clerkClient = c.get('clerk');
        const user = await clerkClient.users.getUser(auth.userId);
        c.set('user', user);
        c.header('x-user-id', auth.userId);
    }
    catch (error) {
        const logger = (0, log_1.getLogger)('auth-middleware');
        logger.error(`Failed to fetch user from Clerk ${error}`);
    }
    await next();
});
const getAuthUser = (c) => c.get('user');
exports.getAuthUser = getAuthUser;
const getAuthUserStrict = (c) => {
    const user = (0, exports.getAuthUser)(c);
    if (!user) {
        throw new http_exception_1.HTTPException(401, { message: 'unauthorized' });
    }
    return user;
};
exports.getAuthUserStrict = getAuthUserStrict;
