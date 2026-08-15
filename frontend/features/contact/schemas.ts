import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  message: z.string().min(10, "Tell us a bit more (at least 10 characters)").max(2000),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
