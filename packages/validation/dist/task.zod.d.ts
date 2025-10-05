import { z } from './zod';
export declare const zCreateTask: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    customerPhone: z.ZodUnion<readonly [z.ZodLiteral<"">, z.ZodOptional<z.ZodString>]>;
    customerName: z.ZodOptional<z.ZodString>;
    geoLocation: z.ZodOptional<z.ZodObject<{
        address: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CreateTaskValues = z.infer<typeof zCreateTask>;
export declare const zTaskListQuery: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    take: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodUnion<readonly [z.ZodEnum<{
        PREPARING: "PREPARING";
        READY: "READY";
        IN_PROGRESS: "IN_PROGRESS";
        ON_HOLD: "ON_HOLD";
        COMPLETED: "COMPLETED";
    }>, z.ZodArray<z.ZodEnum<{
        PREPARING: "PREPARING";
        READY: "READY";
        IN_PROGRESS: "IN_PROGRESS";
        ON_HOLD: "ON_HOLD";
        COMPLETED: "COMPLETED";
    }>>]>>;
    assignedOnly: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type TaskListQuery = z.infer<typeof zTaskListQuery>;
