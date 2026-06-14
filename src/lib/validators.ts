import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "Enter a valid phone number"),
  source: z.enum(["WEBSITE", "REFERRAL", "ZILLOW", "WALK_IN", "SOCIAL_MEDIA", "COLD_CALL"], {
    message: "Select a source",
  }),
  status: z.enum(
    ["NEW_LEAD", "CONTACTED", "SHOWING_SCHEDULED", "OFFER_MADE", "CLOSED_WON", "CLOSED_LOST"],
    { message: "Select a status" },
  ),
  assignedRepId: z.string().min(1, "Assign a sales rep"),
  budget: z.coerce
    .number({ message: "Budget must be a number" })
    .min(1000, "Budget must be at least $1,000"),
  notes: z.string().max(500, "Keep notes under 500 characters").optional().or(z.literal("")),
});

export type LeadFormValues = z.infer<typeof leadSchema>;
