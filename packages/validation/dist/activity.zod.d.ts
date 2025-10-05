import z from 'zod';
export declare const zActivityListQuery: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    take: z.ZodOptional<z.ZodString>;
    topic: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ActivityListQuery = z.infer<typeof zActivityListQuery>;
