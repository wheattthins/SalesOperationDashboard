import type { Role } from "@prisma/client";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  commissionRate: number;
  avatarColor: string;
}

export interface LeadRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  budget: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedRep: { id: string; name: string; avatarColor: string };
}
