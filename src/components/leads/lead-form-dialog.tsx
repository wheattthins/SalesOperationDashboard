"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { leadSchema, type LeadFormValues } from "@/lib/validators";
import {
  CREATE_LEAD_MUTATION,
  UPDATE_LEAD_MUTATION,
  REPS_QUERY,
} from "@/graphql/operations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormInput } from "@/components/shared/form-input";
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS, LEAD_SOURCES, LEAD_STATUS_ORDER } from "@/lib/constants";
import type { LeadRow } from "@/types";

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: LeadRow | null;
  onSaved?: () => void;
}

export function LeadFormDialog({ open, onOpenChange, lead, onSaved }: LeadFormDialogProps) {
  const isEdit = Boolean(lead);
  const { data: repsData } = useQuery<{ reps: { id: string; name: string }[] }>(REPS_QUERY);
  const reps = repsData?.reps ?? [];

  const [createLead, { loading: creating, error: createError }] = useMutation(CREATE_LEAD_MUTATION);
  const [updateLead, { loading: updating, error: updateError }] = useMutation(UPDATE_LEAD_MUTATION);
  const submitting = creating || updating;
  const mutationError = createError || updateError;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      source: "WEBSITE",
      status: "NEW_LEAD",
      assignedRepId: "",
      budget: 250000,
      notes: "",
    },
  });

  // Re-populate the form whenever the dialog opens (for create or edit).
  React.useEffect(() => {
    if (!open) return;
    reset({
      name: lead?.name ?? "",
      email: lead?.email ?? "",
      phone: lead?.phone ?? "",
      source: (lead?.source as LeadFormValues["source"]) ?? "WEBSITE",
      status: (lead?.status as LeadFormValues["status"]) ?? "NEW_LEAD",
      assignedRepId: lead?.assignedRep.id ?? "",
      budget: lead?.budget ?? 250000,
      notes: lead?.notes ?? "",
    });
  }, [open, lead, reset]);

  async function onSubmit(values: LeadFormValues) {
    const input = { ...values, notes: values.notes || null };
    if (isEdit && lead) {
      await updateLead({ variables: { id: lead.id, input } });
    } else {
      await createLead({ variables: { input } });
    }
    onOpenChange(false);
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit lead" : "New lead"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this lead's contact details and pipeline status."
              : "Add a new prospect to the CRM."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput label="Full name" htmlFor="name" error={errors.name?.message} required>
              <Input id="name" placeholder="Jordan Avery" aria-invalid={!!errors.name} {...register("name")} />
            </FormInput>
            <FormInput label="Email" htmlFor="email" error={errors.email?.message} required>
              <Input id="email" type="email" placeholder="jordan@example.com" aria-invalid={!!errors.email} {...register("email")} />
            </FormInput>
            <FormInput label="Phone" htmlFor="phone" error={errors.phone?.message} required>
              <Input id="phone" placeholder="(555) 123-4567" aria-invalid={!!errors.phone} {...register("phone")} />
            </FormInput>
            <FormInput label="Budget" htmlFor="budget" error={errors.budget?.message} required>
              <Input id="budget" type="number" step={1000} placeholder="250000" aria-invalid={!!errors.budget} {...register("budget")} />
            </FormInput>

            <Controller
              control={control}
              name="source"
              render={({ field }) => (
                <FormInput label="Source" error={errors.source?.message} required>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {LEAD_SOURCE_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormInput>
              )}
            />

            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <FormInput label="Status" error={errors.status?.message} required>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUS_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>
                          {LEAD_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormInput>
              )}
            />
          </div>

          <Controller
            control={control}
            name="assignedRepId"
            render={({ field }) => (
              <FormInput label="Assigned sales rep" error={errors.assignedRepId?.message} required>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sales rep" />
                  </SelectTrigger>
                  <SelectContent>
                    {reps.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormInput>
            )}
          />

          <FormInput label="Notes" htmlFor="notes" error={errors.notes?.message} description="Optional context about this lead.">
            <Textarea id="notes" rows={3} placeholder="Pre-approved, looking to close within 60 days..." {...register("notes")} />
          </FormInput>

          {mutationError ? (
            <p className="text-sm font-medium text-destructive">{mutationError.message}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Save changes" : "Create lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
