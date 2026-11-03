import { z } from "zod";
import { formDefinitionSchema, formDetailsSchema, formMetaSchema } from "./definition";

const idSchema = z.string().trim().min(1).max(100);

export const formIdSchema = z.object({ id: idSchema });

export const createFormSchema = formMetaSchema;

export const updateFormDetailsSchema = formDetailsSchema.extend({ id: idSchema });

export const saveDefinitionSchema = z.object({ id: idSchema, definition: formDefinitionSchema });

export const setFormOpenSchema = z.object({ id: idSchema, open: z.boolean() });

export const moveFormSchema = z.object({ id: idSchema, direction: z.enum(["up", "down"]) });
