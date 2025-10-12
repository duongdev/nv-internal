"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const hono_1 = require("hono");
const compress_1 = require("hono/compress");
const logger_1 = require("hono/logger");
const pretty_json_1 = require("hono/pretty-json");
const request_id_1 = require("hono/request-id");
const trailing_slash_1 = require("hono/trailing-slash");
const index_1 = require("./v1/index");
const _IS_VERCEL = process.env.VERCEL === '1';
const app = new hono_1.Hono({ strict: true })
    // * Global middlewares
    .use((0, logger_1.logger)())
    .use((0, compress_1.compress)())
    .use((0, request_id_1.requestId)())
    .use((0, trailing_slash_1.trimTrailingSlash)())
    .use((0, pretty_json_1.prettyJSON)({ space: 2 }))
    // .use(except(() => IS_VERCEL, logger(log.info.bind(log))))
    // * Mounting versioned APIs
    .route('/v1', index_1.hono);
exports.app = app;
exports.default = app;
