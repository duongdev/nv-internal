"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hono = void 0;
const hono_1 = require("hono");
const activity_route_1 = __importDefault(require("./activity/activity.route"));
const auth_1 = require("./middlewares/auth");
const task_route_1 = __importDefault(require("./task/task.route"));
const user_route_1 = __importDefault(require("./user/user.route"));
exports.hono = new hono_1.Hono()
    .get('/health', (c) => c.text('ok'))
    .use('*', auth_1.authMiddleware)
    .route('/activity', activity_route_1.default)
    .route('/task', task_route_1.default)
    .route('/user', user_route_1.default);
