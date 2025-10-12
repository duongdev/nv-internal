"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_validator_1 = require("@hono/zod-validator");
const validation_1 = require("@nv-internal/validation");
const hono_1 = require("hono");
const http_exception_1 = require("hono/http-exception");
const prisma_client_1 = require("@nv-internal/prisma-client");
const log_1 = require("../../lib/log");
const auth_1 = require("../middlewares/auth");
const task_service_1 = require("./task.service");
const router = new hono_1.Hono()
    // Get infinite task list
    .get('/', (0, zod_validator_1.zValidator)('query', validation_1.zTaskListQuery), async (c) => {
    const { cursor, take = '10', status, assignedOnly = 'false', } = c.req.valid('query');
    const user = (0, auth_1.getAuthUserStrict)(c);
    let assignedUserIds = undefined;
    if (assignedOnly === 'true') {
        assignedUserIds = [user.id];
    }
    else if (!(await (0, task_service_1.canUserListTasks)({ user }))) {
        throw new http_exception_1.HTTPException(403, {
            message: 'Bạn không có quyền xem danh sách công việc.',
            cause: 'Permission denied',
        });
    }
    const { tasks, nextCursor, hasNextPage } = await (0, task_service_1.getTaskList)({
        cursor,
        take: Number(take),
        assignedUserIds,
        status: status ? (Array.isArray(status) ? status : [status]) : undefined,
    });
    return c.json({
        tasks,
        nextCursor,
        hasNextPage,
    });
})
    // Create new task
    .post('/', (0, zod_validator_1.zValidator)('json', validation_1.zCreateTask), async (c) => {
    const logger = (0, log_1.getLogger)('task.route:create');
    const data = c.req.valid('json');
    const user = (0, auth_1.getAuthUserStrict)(c);
    const canCreateTask = await (0, task_service_1.canUserCreateTask)({ user });
    if (!canCreateTask) {
        logger.warn({ user }, 'User is not allowed to create tasks');
        throw new http_exception_1.HTTPException(403, {
            message: 'Bạn không có quyền tạo công việc.',
            cause: 'Permission denied',
        });
    }
    // Create the task
    try {
        const task = await (0, task_service_1.createTask)({ data, user });
        c.status(201);
        return c.json(task);
    }
    catch (error) {
        const logger = (0, log_1.getLogger)('task.route:create');
        logger.error({ error }, 'Failed to create task');
        throw new http_exception_1.HTTPException(500, {
            message: 'Không thể tạo công việc.',
            cause: error,
        });
    }
})
    // Get task by ID
    .get('/:id', (0, zod_validator_1.zValidator)('param', validation_1.z.object({ id: validation_1.z.string().regex(/^\d+$/) })), async (c) => {
    const taskId = parseInt(c.req.valid('param').id, 10);
    const user = (0, auth_1.getAuthUserStrict)(c);
    if (!(await (0, task_service_1.canUserViewTask)({ user }))) {
        throw new http_exception_1.HTTPException(403, {
            message: 'Bạn không có quyền xem công việc.',
            cause: 'Permission denied',
        });
    }
    const task = await (0, task_service_1.getTaskById)({ id: taskId });
    if (!task) {
        throw new http_exception_1.HTTPException(404, {
            message: 'Không tìm thấy công việc.',
            cause: 'Task not found',
        });
    }
    return c.json(task);
})
    // Update task assignees
    .put('/:id/assignees', (0, zod_validator_1.zValidator)('param', validation_1.z.object({ id: validation_1.z.string() })), (0, zod_validator_1.zValidator)('json', validation_1.z.object({
    assigneeIds: validation_1.z.array(validation_1.z.string()),
})), async (c) => {
    const taskId = parseInt(c.req.valid('param').id, 10);
    const { assigneeIds } = c.req.valid('json');
    const user = (0, auth_1.getAuthUserStrict)(c);
    const logger = (0, log_1.getLogger)('task.route:updateAssignees');
    // Check permission
    if (!(await (0, task_service_1.canUserUpdateTaskAssignees)({ user }))) {
        logger.warn({ user }, 'User is not allowed to update task assignees');
        throw new http_exception_1.HTTPException(403, {
            message: 'Bạn không có quyền cập nhật người được giao công việc.',
            cause: 'Permission denied',
        });
    }
    // Update the task assignees
    try {
        const updatedTask = await (0, task_service_1.updateTaskAssignees)({
            taskId,
            assigneeIds,
            user,
        });
        return c.json(updatedTask);
    }
    catch (error) {
        logger.error({ error }, 'Failed to update task assignees');
        throw new http_exception_1.HTTPException(500, {
            message: 'Không thể cập nhật người được giao công việc.',
            cause: error,
        });
    }
})
    // Update task status
    .put('/:id/status', (0, zod_validator_1.zValidator)('param', validation_1.z.object({ id: validation_1.z.string() })), (0, zod_validator_1.zValidator)('json', validation_1.z.object({
    status: validation_1.z.enum(prisma_client_1.TaskStatus),
})), async (c) => {
    const taskId = parseInt(c.req.valid('param').id, 10);
    const { status } = c.req.valid('json');
    const user = (0, auth_1.getAuthUserStrict)(c);
    const logger = (0, log_1.getLogger)('task.route:updateStatus');
    // Check permission
    if (!(await (0, task_service_1.canUserUpdateTaskStatus)({ user }))) {
        logger.warn({ user }, 'User is not allowed to update task status');
        throw new http_exception_1.HTTPException(403, {
            message: 'Bạn không có quyền cập nhật trạng thái công việc.',
            cause: 'Permission denied',
        });
    }
    // Update the task status
    try {
        const updatedTask = await (0, task_service_1.updateTaskStatus)({ taskId, status, user });
        return c.json(updatedTask);
    }
    catch (error) {
        logger.error({ error }, 'Failed to update task status');
        throw new http_exception_1.HTTPException(500, {
            message: 'Không thể cập nhật trạng thái công việc.',
            cause: error,
        });
    }
});
exports.default = router;
