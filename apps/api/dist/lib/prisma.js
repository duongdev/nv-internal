"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrisma = void 0;
const serverless_1 = require("@neondatabase/serverless");
const adapter_neon_1 = require("@prisma/adapter-neon");
const ws_1 = __importDefault(require("ws"));
const prisma_client_1 = require("@nv-internal/prisma-client");
const prisma_prefixed_ids_js_1 = require("./prisma-prefixed-ids.js");
serverless_1.neonConfig.webSocketConstructor = ws_1.default;
serverless_1.neonConfig.poolQueryViaFetch = true;
const prefixes = {
    /** biome-ignore-start lint/style/useNamingConvention: <extend model name> */
    Customer: 'cust',
    GeoLocation: 'geo',
    Activity: 'act',
    /** biome-ignore-end lint/style/useNamingConvention: <extend model name> */
};
const getPrisma = (databaseUrl = process.env.DATABASE_URL) => {
    const adapter = new adapter_neon_1.PrismaNeon({ connectionString: databaseUrl });
    const prisma = new prisma_client_1.PrismaClient({
        adapter,
    });
    return (0, prisma_prefixed_ids_js_1.extendPrismaClient)(prisma, {
        prefixes,
    });
};
exports.getPrisma = getPrisma;
