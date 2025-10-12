"use strict";
var CreateBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var ExportStar =
  (this && this.__exportStar) ||
  function (m, exports) {
    for (var p in m)
      if (p !== "default" && !Object.hasOwn(exports, p))
        CreateBinding(exports, m, p);
  };
Object.defineProperty(exports, "__esModule", { value: true });
// Re-export the generated Prisma client that will be generated into this package
// by configuring the Prisma generator output to `packages/prisma-client/generated`.
// @ts-ignore - generated client will exist after `prisma generate`
ExportStar(require("../generated"), exports);
