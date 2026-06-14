export const typeDefs = /* GraphQL */ `
  enum Role {
    ADMIN
    SALES_MANAGER
    SALES_REP
    FINANCE
  }

  enum LeadStatus {
    NEW_LEAD
    CONTACTED
    SHOWING_SCHEDULED
    OFFER_MADE
    CLOSED_WON
    CLOSED_LOST
  }

  enum LeadSource {
    WEBSITE
    REFERRAL
    ZILLOW
    WALK_IN
    SOCIAL_MEDIA
    COLD_CALL
  }

  enum CommissionStatus {
    PENDING
    APPROVED
    PAID
    CANCELLED
  }

  type User {
    id: ID!
    name: String!
    email: String!
    role: Role!
    commissionRate: Float!
    avatarColor: String!
  }

  type Lead {
    id: ID!
    name: String!
    email: String!
    phone: String!
    source: LeadSource!
    status: LeadStatus!
    budget: Float!
    notes: String
    createdAt: String!
    updatedAt: String!
    assignedRep: User!
    sale: Sale
  }

  type Sale {
    id: ID!
    salePrice: Float!
    closedAt: String!
    rep: User!
    lead: Lead!
    commission: Commission
  }

  type Commission {
    id: ID!
    rate: Float!
    amount: Float!
    status: CommissionStatus!
    createdAt: String!
    paidAt: String
    rep: User!
    sale: Sale!
    approvedBy: User
  }

  type AuditLog {
    id: ID!
    action: String!
    entityType: String!
    entityId: String!
    summary: String!
    actorName: String!
    actorRole: Role!
    createdAt: String!
  }

  type LeadPage {
    items: [Lead!]!
    total: Int!
    page: Int!
    pageSize: Int!
    totalPages: Int!
  }

  type KpiStats {
    totalRevenue: Float!
    activeLeads: Int!
    closedDeals: Int!
    pendingCommissions: Float!
  }

  type MonthlyRevenuePoint {
    month: String!
    revenue: Float!
    deals: Int!
  }

  type ConversionStat {
    status: LeadStatus!
    count: Int!
  }

  type RepPerformance {
    rep: User!
    revenue: Float!
    deals: Int!
    commission: Float!
  }

  type DashboardStats {
    kpis: KpiStats!
    monthlyRevenue: [MonthlyRevenuePoint!]!
    conversion: [ConversionStat!]!
    topReps: [RepPerformance!]!
  }

  type PipelineColumn {
    status: LeadStatus!
    leads: [Lead!]!
    count: Int!
    value: Float!
  }

  type CommissionPayout {
    rep: User!
    pending: Float!
    approved: Float!
    paid: Float!
    total: Float!
  }

  type Reports {
    monthlyRevenue: [MonthlyRevenuePoint!]!
    revenueByRep: [RepPerformance!]!
    payouts: [CommissionPayout!]!
  }

  input LeadInput {
    name: String!
    email: String!
    phone: String!
    source: LeadSource!
    status: LeadStatus!
    budget: Float!
    assignedRepId: ID!
    notes: String
  }

  type Query {
    me: User
    users(role: Role): [User!]!
    reps: [User!]!
    dashboardStats: DashboardStats!
    leads(search: String, status: LeadStatus, repId: ID, page: Int, pageSize: Int): LeadPage!
    lead(id: ID!): Lead
    pipeline: [PipelineColumn!]!
    commissions(status: CommissionStatus, repId: ID): [Commission!]!
    reports: Reports!
    auditLogs(limit: Int): [AuditLog!]!
  }

  type Mutation {
    createLead(input: LeadInput!): Lead!
    updateLead(id: ID!, input: LeadInput!): Lead!
    updateLeadStatus(id: ID!, status: LeadStatus!): Lead!
    approveCommission(id: ID!): Commission!
    payCommission(id: ID!): Commission!
    cancelCommission(id: ID!): Commission!
  }
`;
