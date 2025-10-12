"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doesUserHaveRole = doesUserHaveRole;
exports.isUserAdmin = isUserAdmin;
exports.canUserCreateUser = canUserCreateUser;
exports.canUserListUsers = canUserListUsers;
exports.canUserBanUnbanUser = canUserBanUnbanUser;
exports.canUserUpdateUserRoles = canUserUpdateUserRoles;
exports.createClerkUser = createClerkUser;
exports.getAllUsers = getAllUsers;
exports.banUser = banUser;
exports.unbanUser = unbanUser;
exports.updateUserRoles = updateUserRoles;
const validation_1 = require("@nv-internal/validation");
const http_exception_1 = require("hono/http-exception");
const log_1 = require("../../lib/log");
function doesUserHaveRole({ user, ...args }) {
    const rolesOfUser = (user.publicMetadata?.roles ?? []);
    if ('role' in args) {
        return rolesOfUser.includes(args.role);
    }
    if ('any' in args) {
        return rolesOfUser.some((role) => args.any.includes(role));
    }
    if ('all' in args) {
        return args.all.every((role) => rolesOfUser.includes(role));
    }
    return false;
}
function isUserAdmin({ user }) {
    return doesUserHaveRole({ user, role: validation_1.UserRole.nvInternalAdmin });
}
function canUserCreateUser({ user }) {
    return isUserAdmin({ user });
}
async function canUserListUsers({ user }) {
    return isUserAdmin({ user });
}
async function canUserBanUnbanUser({ user }) {
    return isUserAdmin({ user });
}
async function canUserUpdateUserRoles({ user }) {
    return isUserAdmin({ user });
}
// ---
async function createClerkUser({ clerkClient, data, usernameRetryCount, }) {
    const logger = (0, log_1.getLogger)('user.service:createClerkUser');
    logger.trace({ ...data, password: undefined }, 'Creating user in Clerk');
    try {
        // Create the user in Clerk
        const username = usernameRetryCount
            ? `${data.username}${usernameRetryCount}`
            : data.username;
        const user = await clerkClient.users.createUser({
            skipPasswordChecks: true,
            firstName: data.firstName,
            lastName: data.lastName,
            emailAddress: data.email ? [data.email] : undefined,
            username,
            password: data.password || username,
            publicMetadata: {
                phoneNumber: data.phone,
                roles: [validation_1.UserRole.nvInternalWorker],
                defaultPasswordChanged: false,
            },
        });
        logger.trace({ user }, 'User created in Clerk');
        return user;
    }
    catch (error) {
        // If the username is taken, try again appending a number
        const clerkError = error;
        const isUsernameTaken = clerkError.errors.some((e) => e.code === 'form_identifier_exists');
        if (isUsernameTaken) {
            logger.warn({ error, data }, 'Username is already taken, trying again with a different username');
            return createClerkUser({
                clerkClient,
                data,
                usernameRetryCount: (usernameRetryCount ?? 0) + 1,
            });
        }
        logger.error({ error, data }, 'Error creating user in Clerk');
        throw error;
    }
}
async function getAllUsers({ clerkClient, }) {
    const totalUserCount = await clerkClient.users.getCount();
    // Keep pagination in mind
    const pageSize = 100;
    const pageCount = Math.ceil(totalUserCount / pageSize);
    const pages = await Promise.all(Array.from({ length: pageCount }, (_, i) => clerkClient.users.getUserList({ offset: i * pageSize, limit: pageSize })));
    return pages.map((p) => p.data).flat();
}
async function banUser({ clerkClient, userId, }) {
    const logger = (0, log_1.getLogger)('user.service:banUser');
    logger.trace({ userId }, 'Banning user in Clerk');
    try {
        const updatedUser = await clerkClient.users.banUser(userId);
        logger.trace({ userId, updatedUser }, 'User banned in Clerk');
        return updatedUser;
    }
    catch (error) {
        logger.error({ error, userId }, 'Error banning user in Clerk');
        throw error;
    }
}
async function unbanUser({ clerkClient, userId, }) {
    const logger = (0, log_1.getLogger)('user.service:unbanUser');
    logger.trace({ userId }, 'Unbanning user in Clerk');
    try {
        const updatedUser = await clerkClient.users.unbanUser(userId);
        logger.trace({ userId, updatedUser }, 'User unbanned in Clerk');
        return updatedUser;
    }
    catch (error) {
        logger.error({ error, userId }, 'Error unbanning user in Clerk');
        throw error;
    }
}
async function updateUserPublicMetadata({ clerkClient, userId, publicMetadata, }) {
    const logger = (0, log_1.getLogger)('user.service:updateUserPublicMetadata');
    logger.trace({ userId, publicMetadata }, 'Updating user public metadata in Clerk');
    try {
        const currentUser = await clerkClient.users.getUser(userId);
        if (!currentUser) {
            logger.error({ userId }, 'User not found in Clerk');
            throw new http_exception_1.HTTPException(404, {
                message: 'User not found',
                cause: `User with ID ${userId} does not exist`,
            });
        }
        const { success, data: newPublicMetadata } = await validation_1.zUserPublicMetadata.safeParseAsync({
            ...currentUser.publicMetadata,
            ...publicMetadata,
        });
        if (!success) {
            logger.error({ userId, publicMetadata }, 'Invalid public metadata');
            throw new http_exception_1.HTTPException(400, {
                message: 'Invalid public metadata',
                cause: 'Validation failed',
            });
        }
        const updatedUser = await clerkClient.users.updateUser(userId, {
            publicMetadata: newPublicMetadata,
        });
        logger.trace({ userId, updatedUser }, 'User public metadata updated in Clerk');
        return updatedUser;
    }
    catch (error) {
        logger.error({ error, userId, publicMetadata }, 'Error updating user public metadata in Clerk');
        throw error;
    }
}
async function updateUserRoles({ clerkClient, userId, roles, }) {
    const logger = (0, log_1.getLogger)('user.service:updateUserRoles');
    logger.trace({ userId, roles }, 'Updating user roles in Clerk');
    try {
        const updatedUser = await updateUserPublicMetadata({
            clerkClient,
            userId,
            publicMetadata: {
                roles,
            },
        });
        logger.trace({ userId, updatedUser }, 'User roles updated in Clerk');
        return updatedUser;
    }
    catch (error) {
        logger.error({ error, userId, roles }, 'Error updating user roles in Clerk');
        throw error;
    }
}
