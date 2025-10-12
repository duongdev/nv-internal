"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_validator_1 = require("@hono/zod-validator");
const activity_zod_1 = require("@nv-internal/validation/src/activity.zod");
const hono_1 = require("hono");
const auth_1 = require("../middlewares/auth");
const activity_service_1 = require("./activity.service");
const router = new hono_1.Hono()
    // Get activity infinite list
    .get('/', (0, zod_validator_1.zValidator)('query', activity_zod_1.zActivityListQuery), async (c) => {
    (0, auth_1.getAuthUserStrict)(c);
    const { cursor, take = '10', topic } = c.req.valid('query');
    const { activities, hasNextPage, nextCursor } = await (0, activity_service_1.getActivityList)({
        cursor,
        take: Number(take),
        topic,
    });
    return c.json({
        activities,
        hasNextPage,
        nextCursor,
    });
});
exports.default = router;
