import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom d'equipe doit contenir au moins 2 caractères")
    .max(60, "Le nom ne peut dépasser 60 caractères"),
  memberIds: z.array(z.string().min(1)),
});

export const addMembersSchema = z.object({
  memberIds: createGroupSchema.shape.memberIds.min(1, "Sélectionnez au moins un coéquipier"),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export const groupNameSchema = createGroupSchema.pick({ name: true });
export type GroupNameInput = z.infer<typeof groupNameSchema>;

export type AddMembersInput = z.infer<typeof addMembersSchema>;
export const memberIdSchema = z.string().min(1);