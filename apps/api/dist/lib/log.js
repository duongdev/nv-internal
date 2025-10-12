"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogger = exports.log = void 0;
const pino_1 = __importDefault(require("pino"));
const IS_DEV = process.env.NODE_ENV === 'development';
const IS_PROD = process.env.NODE_ENV === 'production';
exports.log = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || 'debug',
    transport: IS_DEV
        ? {
            target: 'pino-pretty',
        }
        : undefined,
    base: IS_PROD
        ? {
            env: process.env.NODE_ENV,
            revision: process.env.VERCEL_GIT_COMMIT_SHA,
        }
        : undefined,
});
const getLogger = (name) => exports.log.child({ name });
exports.getLogger = getLogger;
