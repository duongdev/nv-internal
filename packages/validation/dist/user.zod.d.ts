import { z } from './zod';
export declare const UserRole: {
    readonly nvInternalAdmin: "nv_internal_admin";
    readonly nvInternalWorker: "nv_internal_worker";
};
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export declare const zCreateUser: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodString;
    email: z.ZodUnion<readonly [z.ZodLiteral<"">, z.ZodEmail]>;
    phone: z.ZodString;
    username: z.ZodString;
    password: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"">, z.ZodString]>>;
}, z.core.$strip>;
export declare const zUserPublicMetadata: z.ZodObject<{
    phoneNumber: z.ZodOptional<z.ZodString>;
    roles: z.ZodArray<z.ZodEnum<{
        readonly nvInternalAdmin: "nv_internal_admin";
        readonly nvInternalWorker: "nv_internal_worker";
    }>>;
    defaultPasswordChanged: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type UserPublicMetadata = z.infer<typeof zUserPublicMetadata>;
export declare const zChangeUserPassword: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, z.core.$strip>;
export type ChangeUserPassword = z.infer<typeof zChangeUserPassword>;
