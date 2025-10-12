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
// Re-export Prisma client types from the API package's generated client.
// At runtime (Vercel bundle) the generated client lives under apps/api/generated/prisma,
// so reference it via a relative path from this package's dist output.
// @ts-ignore - generated client exists in the workspace at apps/api/generated/prisma
// Note: the relative path is chosen so the compiled JS in `dist/` will require the
// runtime client located at `apps/api/generated/prisma/client` inside the Vercel bundle.
ExportStar(require("@nv-internal/prisma-client"), exports);
