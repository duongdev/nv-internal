"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processNestedData = exports.findRelationModel = void 0;
exports.createPrefixedIdsExtension = createPrefixedIdsExtension;
exports.extendPrismaClient = extendPrismaClient;
exports.getDMMF = getDMMF;
exports.getModelNames = getModelNames;
/** biome-ignore-all lint/suspicious/noExplicitAny: <Copied from original> */
const crypto_1 = require("crypto");
// Lazy loader for @paralleldrive/cuid2 to avoid requiring an ESM module from CommonJS bundles.
// We dynamically import the package and cache a createId function (initialized with length 24).
let cachedCreateId = null;
let cuidLoadAttempted = false;
function loadCuid2Async() {
    if (cuidLoadAttempted || cachedCreateId) {
        return;
    }
    cuidLoadAttempted = true;
    // @ts-ignore - dynamic import of package that may not be present at compile time
    import('@paralleldrive/cuid2')
        .then((mod) => {
        // Prefer `init` to configure length; fallback to `createId` if present.
        const initFn = mod.init || mod.default?.init;
        if (typeof initFn === 'function') {
            try {
                cachedCreateId = initFn({ length: 24 });
            }
            catch {
                // ignore and try createId fallback below
            }
        }
        if (!cachedCreateId) {
            const createId = mod.createId || mod.default?.createId || mod.default;
            if (typeof createId === 'function') {
                // wrap so callers always call a zero-arg function
                cachedCreateId = () => createId();
            }
        }
    })
        .catch(() => {
        // ignore import failures — we'll keep using the crypto fallback
    });
}
const defaultIdGenerator = (prefix) => {
    // If cuid2 is ready, use it synchronously.
    if (cachedCreateId) {
        try {
            return `${prefix}_${cachedCreateId()}`;
        }
        catch {
            // fallthrough to crypto fallback
        }
    }
    // Kick off async load for future calls, but generate an ID synchronously with crypto now.
    loadCuid2Async();
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const length = 24;
    const bytes = (0, crypto_1.randomBytes)(length);
    let id = '';
    for (let i = 0; i < length; i++) {
        id += alphabet[bytes[i] % alphabet.length];
    }
    return `${prefix}_${id}`;
};
// All possible relation operations in Prisma
const RELATION_OPERATIONS = [
    'create',
    'createMany',
    'connectOrCreate',
    'upsert',
    'update',
    'updateMany',
];
// Helper to find the relation model from DMMF
const findRelationModel = (dmmf, parentModel, fieldName) => {
    // Find the model in DMMF
    const model = dmmf.datamodel.models.find((m) => m.name === parentModel);
    if (!model) {
        return null;
    }
    // Find the field that matches the relation name
    const field = model.fields.find((f) => f.name === fieldName);
    if (!field || field.kind !== 'object') {
        return null;
    }
    // Return the related model name
    return field.type;
};
exports.findRelationModel = findRelationModel;
// Helper function to check if key is a relation operation
const isRelationOperation = (key) => {
    return RELATION_OPERATIONS.includes(key);
};
// Helper function to process nested data with proper model detection
const processNestedData = (data, model, prefixedId, dmmf, shouldAddRootId = true) => {
    if (!data) {
        return data;
    }
    // Handle array of items
    if (Array.isArray(data)) {
        return data.map((item) => (0, exports.processNestedData)(item, model, prefixedId, dmmf, shouldAddRootId));
    }
    // Handle object
    if (typeof data === 'object') {
        const result = { ...data };
        // Generate ID for the current model if needed (for nested creates)
        if (shouldAddRootId && !result.id) {
            const id = prefixedId(model);
            if (id) {
                result.id = id;
            }
        }
        // Process nested relations by checking each key in the object
        for (const [key, value] of Object.entries(result)) {
            if (!value || typeof value !== 'object') {
                continue;
            }
            // CASE 1: Key itself is a relation operation (root level operation)
            if (isRelationOperation(key)) {
                // Find which field this operation belongs to by looking at non-operation keys
                const relationFields = Object.keys(result).filter((k) => !isRelationOperation(k));
                for (const relationField of relationFields) {
                    const relatedModel = (0, exports.findRelationModel)(dmmf, model, relationField);
                    if (relatedModel) {
                        if (key === 'createMany' && 'data' in value) {
                            // Handle createMany operation
                            const createManyOp = value;
                            result[key] = {
                                ...value,
                                data: (0, exports.processNestedData)(createManyOp.data, relatedModel, prefixedId, dmmf),
                            };
                        }
                        else if (key === 'upsert') {
                            // Handle upsert operation (has create and update)
                            result[key] = {
                                ...value,
                                create: value.create
                                    ? (0, exports.processNestedData)(value.create, relatedModel, prefixedId, dmmf)
                                    : value.create,
                                update: value.update,
                            };
                        }
                        else if (key === 'connectOrCreate') {
                            // Handle connectOrCreate operation
                            result[key] = {
                                ...value,
                                create: value.create
                                    ? (0, exports.processNestedData)(value.create, relatedModel, prefixedId, dmmf)
                                    : value.create,
                            };
                        }
                        else if (key === 'create' || key === 'createMany') {
                            // Only process create operations with ID generation
                            result[key] = (0, exports.processNestedData)(value, relatedModel, prefixedId, dmmf);
                        }
                        else {
                            // For other operations like update, just pass through the value
                            result[key] = value;
                        }
                        break;
                    }
                }
            }
            // CASE 2: Key might be a relation field that contains operations
            else {
                const relatedModel = (0, exports.findRelationModel)(dmmf, model, key);
                if (!relatedModel) {
                    continue;
                }
                // Process all possible operations in this relation field
                const updatedValue = { ...value };
                // Process each operation type
                for (const op of RELATION_OPERATIONS) {
                    if (!(op in value)) {
                        continue;
                    }
                    if (op === 'createMany' && 'data' in value[op]) {
                        updatedValue[op] = {
                            ...value[op],
                            data: (0, exports.processNestedData)(value[op].data, relatedModel, prefixedId, dmmf),
                        };
                    }
                    else if (op === 'upsert') {
                        updatedValue[op] = {
                            ...value[op],
                            create: value[op].create
                                ? (0, exports.processNestedData)(value[op].create, relatedModel, prefixedId, dmmf)
                                : value[op].create,
                            update: value[op].update, // Don't process update
                        };
                    }
                    else if (op === 'connectOrCreate') {
                        // Special handling for connectOrCreate - it's an array where each item has where/create
                        if (Array.isArray(value[op])) {
                            updatedValue[op] = value[op].map((connectOrCreateItem) => ({
                                ...connectOrCreateItem,
                                create: connectOrCreateItem.create
                                    ? (0, exports.processNestedData)(connectOrCreateItem.create, relatedModel, prefixedId, dmmf, true)
                                    : connectOrCreateItem.create,
                            }));
                        }
                        else {
                            // Fallback for non-array connectOrCreate (shouldn't happen in normal usage)
                            updatedValue[op] = value[op];
                        }
                    }
                    else if (op === 'create' || op === 'createMany') {
                        // Only process create operations with ID generation
                        updatedValue[op] = (0, exports.processNestedData)(value[op], relatedModel, prefixedId, dmmf);
                    }
                    else {
                        // For other operations like update, just pass through the value
                        updatedValue[op] = value[op];
                    }
                }
                result[key] = updatedValue;
            }
        }
        return result;
    }
    return data;
};
exports.processNestedData = processNestedData;
function createPrefixedIdsExtension(config, dmmf) {
    if (!dmmf) {
        throw new Error('DMMF is required for prefixed IDs extension');
    }
    const { prefixes, idGenerator = defaultIdGenerator } = config;
    const prefixedId = (modelName) => {
        if (modelName in prefixes) {
            return idGenerator(prefixes[modelName]);
        }
        return null;
    };
    const createOperationHandler = (operation) => {
        return ({ args, query, model }) => {
            if (operation === 'upsert') {
                // For upsert operations, add ID to create branch only
                if (args.create && !args.create.id) {
                    const id = prefixedId(model);
                    if (id) {
                        args.create.id = id;
                    }
                }
                // Process nested data in both create and update branches
                if (dmmf) {
                    if (args.create) {
                        args.create = (0, exports.processNestedData)(args.create, model, prefixedId, dmmf, true);
                    }
                    if (args.update) {
                        args.update = (0, exports.processNestedData)(args.update, model, prefixedId, dmmf, false);
                    }
                }
            }
            else if (operation === 'connectOrCreate') {
                // For connectOrCreate operations, add ID to create branch only
                if (args.create && !args.create.id) {
                    const id = prefixedId(model);
                    if (id) {
                        args.create.id = id;
                    }
                }
                // Process nested data in create branch
                if (dmmf && args.create) {
                    args.create = (0, exports.processNestedData)(args.create, model, prefixedId, dmmf, true);
                }
            }
            else if (args.data) {
                if (operation === 'createMany') {
                    // For createMany, data is an array
                    if (Array.isArray(args.data)) {
                        args.data = args.data.map((item) => {
                            if (!item.id) {
                                const id = prefixedId(model);
                                if (id) {
                                    item.id = id;
                                }
                            }
                            return item;
                        });
                    }
                }
                else if (operation === 'create') {
                    // For regular create operations only
                    if (!args.data.id) {
                        const id = prefixedId(model);
                        if (id) {
                            args.data.id = id;
                        }
                    }
                    // Process nested data to add IDs to nested creates
                    if (dmmf) {
                        args.data = (0, exports.processNestedData)(args.data, model, prefixedId, dmmf, true);
                    }
                }
                else if (operation === 'update' || operation === 'updateMany') {
                    // For update operations, only process nested creates, don't add ID to root
                    if (dmmf) {
                        args.data = (0, exports.processNestedData)(args.data, model, prefixedId, dmmf, false);
                    }
                }
            }
            return query(args);
        };
    };
    return {
        name: 'prefixedIds',
        query: {
            // biome-ignore lint/style/useNamingConvention: <it's ok>
            $allModels: {
                create: createOperationHandler('create'),
                createMany: createOperationHandler('createMany'),
                update: createOperationHandler('update'),
                updateMany: createOperationHandler('updateMany'),
                upsert: createOperationHandler('upsert'),
                connectOrCreate: createOperationHandler('connectOrCreate'),
            },
        },
    };
}
function extendPrismaClient(prisma, config) {
    const dmmf = getDMMF(prisma);
    return prisma.$extends(createPrefixedIdsExtension(config, dmmf));
}
// Helper function to get DMMF from a Prisma Client instance or query context
function getDMMF(clientOrContext) {
    // Try newer structure first (_runtimeDataModel)
    if (clientOrContext._runtimeDataModel) {
        const modelsEntries = Object.entries(clientOrContext._runtimeDataModel.models);
        return {
            datamodel: {
                models: modelsEntries.map(([name, model]) => ({
                    name: name,
                    fields: model.fields.map((field) => ({
                        name: field.name,
                        kind: field.relationName ? 'object' : 'scalar',
                        type: field.type,
                        isList: field.isList,
                    })),
                })),
            },
        };
    }
    // Fallback to older structures
    return (clientOrContext._baseDmmf ||
        clientOrContext._dmmf ||
        clientOrContext._client?._baseDmmf ||
        clientOrContext._client?._dmmf);
}
// Helper function to get all model names from a Prisma Client instance
function getModelNames(prismaClient) {
    const dmmf = getDMMF(prismaClient);
    if (!dmmf) {
        return [];
    }
    return dmmf.datamodel.models.map((model) => model.name);
}
