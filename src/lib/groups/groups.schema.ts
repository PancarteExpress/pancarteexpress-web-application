import * as z from "zod";

// Messages : clés i18n du namespace groups.errors, traduites à l'affichage

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "nameTooShort")
    .max(60, "nameTooLong"),
  memberIds: z.array(z.string().min(1)),
});

export const addMembersSchema = z.object({
  memberIds: createGroupSchema.shape.memberIds.min(1, "noMemberSelected"),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export const groupNameSchema = createGroupSchema.pick({ name: true });
export type GroupNameInput = z.infer<typeof groupNameSchema>;

export type AddMembersInput = z.infer<typeof addMembersSchema>;
export const memberIdSchema = z.string().min(1);

export const userSearchQuerySchema = z.string().trim().toLowerCase().min(3).max(254);

export const billingModeSchema = z.enum(["INDIVIDUAL", "GROUP"]);