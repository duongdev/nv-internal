"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zActivityListQuery = void 0;
const zod_1 = __importDefault(require("zod"));
exports.zActivityListQuery = zod_1.default.object({
    cursor: zod_1.default.string().optional(),
    take: zod_1.default.string().optional(),
    topic: zod_1.default.string().optional(),
});
