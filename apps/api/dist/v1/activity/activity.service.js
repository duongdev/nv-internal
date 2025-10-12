"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityTopic = getActivityTopic;
exports.getActivityList = getActivityList;
exports.createActivity = createActivity;
const log_1 = require("../../lib/log");
const prisma_1 = require("../../lib/prisma");
function getActivityTopic(params) {
    if (params.entityType === 'TASK') {
        return `TASK_${params.entityId}`;
    }
    return 'GENERAL';
}
async function getActivityList({ cursor, take, topic, }) {
    const prisma = (0, prisma_1.getPrisma)();
    const topicValue = (typeof topic === 'string' && topic) ||
        (typeof topic === 'object' && getActivityTopic(topic)) ||
        undefined;
    const where = {
        ...(topic ? { topic: topicValue } : {}),
    };
    const activities = await prisma.activity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasNextPage = activities.length === take;
    const nextCursor = hasNextPage
        ? activities[activities.length - 1].id.toString()
        : undefined;
    return {
        activities,
        nextCursor,
        hasNextPage,
    };
}
async function createActivity({ topic, payload, action, userId, }, tx) {
    const logger = (0, log_1.getLogger)('activity.service:createActivity');
    const prisma = tx ?? (0, prisma_1.getPrisma)();
    logger.trace({ topic, payload, action, userId }, 'Creating activity log');
    const activity = await prisma.activity.create({
        data: {
            topic: getActivityTopic(topic),
            payload,
            action,
            userId,
        },
    });
    logger.trace({ activity }, 'Activity log created');
    return activity;
}
