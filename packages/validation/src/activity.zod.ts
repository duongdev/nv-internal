import z from 'zod'

export const zActivityListQuery = z.object({
  cursor: z.string().optional(),
  take: z.string().optional(),
  topic: z.string().optional(),
})
export type ActivityListQuery = z.infer<typeof zActivityListQuery>
