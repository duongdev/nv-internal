"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canUserCreateTask = canUserCreateTask;
exports.canUserListTasks = canUserListTasks;
exports.canUserViewTask = canUserViewTask;
exports.canUserUpdateTaskAssignees = canUserUpdateTaskAssignees;
exports.canUserUpdateTaskStatus = canUserUpdateTaskStatus;
exports.createTask = createTask;
exports.getTaskList = getTaskList;
exports.getTaskById = getTaskById;
exports.updateTaskAssignees = updateTaskAssignees;
exports.updateTaskStatus = updateTaskStatus;
const log_1 = require("../../lib/log");
const prisma_1 = require("../../lib/prisma");
const activity_service_1 = require("../activity/activity.service");
const user_service_1 = require("../user/user.service");
const DEFAULT_TASK_INCLUDE = {
    customer: true,
    geoLocation: true,
};
async function canUserCreateTask({ user }) {
    return (0, user_service_1.isUserAdmin)({ user });
}
async function canUserListTasks({ user }) {
    return (0, user_service_1.isUserAdmin)({ user });
}
async function canUserViewTask({ user }) {
    return (0, user_service_1.isUserAdmin)({ user });
}
async function canUserUpdateTaskAssignees({ user }) {
    return (0, user_service_1.isUserAdmin)({ user });
}
async function canUserUpdateTaskStatus({ user }) {
    return (0, user_service_1.isUserAdmin)({ user });
}
async function createTask({ data, user, }) {
    const logger = (0, log_1.getLogger)('task.service:createTask');
    logger.trace({ data, user }, 'Creating task');
    try {
        const prisma = (0, prisma_1.getPrisma)();
        const task = await prisma.$transaction(async (tx) => {
            const hasCustomer = data.customerName || data.customerPhone;
            let customer = hasCustomer
                ? await tx.customer.findFirst({
                    where: {
                        phone: data.customerPhone,
                        name: data.customerName,
                    },
                })
                : null;
            if (!customer) {
                logger.trace({ data }, 'Creating new customer');
                customer = await tx.customer.create({
                    data: {
                        phone: data.customerPhone,
                        name: data.customerName,
                    },
                });
            }
            logger.trace({ customer }, 'Using existing customer');
            let geoLocationId = undefined;
            if (data.geoLocation?.lat !== undefined &&
                data.geoLocation?.lng !== undefined) {
                const geoLocation = await tx.geoLocation.create({
                    data: {
                        address: data.geoLocation.address,
                        name: data.geoLocation.name,
                        lat: data.geoLocation.lat,
                        lng: data.geoLocation.lng,
                    },
                });
                geoLocationId = geoLocation.id;
            }
            const createdTask = await tx.task.create({
                data: {
                    title: data.title,
                    description: data.description,
                    customerId: customer.id,
                    geoLocationId,
                },
                include: DEFAULT_TASK_INCLUDE,
            });
            // Create activity log
            await (0, activity_service_1.createActivity)({
                action: 'TASK_CREATED',
                userId: user.id,
                topic: { entityType: 'TASK', entityId: createdTask.id },
                payload: {},
            }, tx);
            return createdTask;
        });
        logger.info({ task }, 'Task created successfully');
        return task;
    }
    catch (error) {
        logger.error({ error }, 'Error creating task');
        throw error;
    }
}
async function getTaskList({ cursor, take = 10, assignedUserIds, status, }) {
    const prisma = (0, prisma_1.getPrisma)();
    const where = {
        ...(assignedUserIds ? { assigneeIds: { hasSome: assignedUserIds } } : {}),
        ...(status ? { status: { in: status } } : {}),
    };
    const tasks = await prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        include: DEFAULT_TASK_INCLUDE,
        ...(cursor ? { cursor: { id: parseInt(cursor, 10) }, skip: 1 } : {}),
    });
    const hasNextPage = tasks.length === take;
    const nextCursor = hasNextPage
        ? tasks[tasks.length - 1].id.toString()
        : undefined;
    return {
        tasks,
        nextCursor,
        hasNextPage,
    };
}
async function getTaskById({ id }) {
    const prisma = (0, prisma_1.getPrisma)();
    const task = await prisma.task.findUnique({
        where: { id },
        include: DEFAULT_TASK_INCLUDE,
    });
    return task;
}
async function updateTaskAssignees({ taskId, assigneeIds, user, }) {
    const prisma = (0, prisma_1.getPrisma)();
    const logger = (0, log_1.getLogger)('task.service:updateTaskAssignees');
    logger.trace({ taskId, assigneeIds, user }, 'Updating task assignees');
    try {
        const updatedTask = await prisma.$transaction(async (tx) => {
            const task = await tx.task.update({
                where: { id: taskId },
                data: {
                    assigneeIds,
                },
                include: DEFAULT_TASK_INCLUDE,
            });
            // Create activity log
            await (0, activity_service_1.createActivity)({
                action: 'TASK_ASSIGNEES_UPDATED',
                userId: user?.id || null,
                topic: { entityType: 'TASK', entityId: task.id },
                payload: { newAssigneeIds: assigneeIds },
            }, tx);
            return task;
        });
        logger.info({ updatedTask }, 'Task assignees updated successfully');
        return updatedTask;
    }
    catch (error) {
        logger.error({ error }, 'Error updating task assignees');
        throw error;
    }
}
async function updateTaskStatus({ taskId, status, user, }) {
    const prisma = (0, prisma_1.getPrisma)();
    const logger = (0, log_1.getLogger)('task.service:updateTaskStatus');
    logger.trace({ taskId, status, user }, 'Updating task status');
    try {
        const updatedTask = await prisma.$transaction(async (tx) => {
            const task = await tx.task.update({
                where: { id: taskId },
                data: {
                    status,
                },
                include: DEFAULT_TASK_INCLUDE,
            });
            // Create activity log
            await (0, activity_service_1.createActivity)({
                action: 'TASK_STATUS_UPDATED',
                userId: user?.id || null,
                topic: { entityType: 'TASK', entityId: task.id },
                payload: { newStatus: status },
            }, tx);
            return task;
        });
        logger.info({ updatedTask }, 'Task status updated successfully');
        return updatedTask;
    }
    catch (error) {
        logger.error({ error }, 'Error updating task status');
        throw error;
    }
}
