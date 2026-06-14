import { gql } from "@apollo/client";

export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    name
    email
    role
    commissionRate
    avatarColor
  }
`;

export const LEAD_FIELDS = gql`
  fragment LeadFields on Lead {
    id
    name
    email
    phone
    source
    status
    budget
    notes
    createdAt
    updatedAt
    assignedRep {
      id
      name
      avatarColor
    }
  }
`;

export const COMMISSION_FIELDS = gql`
  fragment CommissionFields on Commission {
    id
    rate
    amount
    status
    createdAt
    paidAt
    rep {
      id
      name
      avatarColor
    }
    sale {
      id
      salePrice
      closedAt
      lead {
        id
        name
      }
    }
    approvedBy {
      id
      name
    }
  }
`;

export const ME_QUERY = gql`
  ${USER_FIELDS}
  query Me {
    me {
      ...UserFields
    }
  }
`;

export const REPS_QUERY = gql`
  query Reps {
    reps {
      id
      name
      avatarColor
      commissionRate
    }
  }
`;

export const DASHBOARD_STATS_QUERY = gql`
  query DashboardStats {
    dashboardStats {
      kpis {
        totalRevenue
        activeLeads
        closedDeals
        pendingCommissions
      }
      monthlyRevenue {
        month
        revenue
        deals
      }
      conversion {
        status
        count
      }
      topReps {
        rep {
          id
          name
          avatarColor
        }
        revenue
        deals
        commission
      }
    }
  }
`;

export const LEADS_QUERY = gql`
  ${LEAD_FIELDS}
  query Leads($search: String, $status: LeadStatus, $repId: ID, $page: Int, $pageSize: Int) {
    leads(search: $search, status: $status, repId: $repId, page: $page, pageSize: $pageSize) {
      items {
        ...LeadFields
      }
      total
      page
      pageSize
      totalPages
    }
  }
`;

export const LEAD_QUERY = gql`
  ${LEAD_FIELDS}
  query Lead($id: ID!) {
    lead(id: $id) {
      ...LeadFields
      sale {
        id
        salePrice
        closedAt
        commission {
          id
          amount
          status
        }
      }
    }
  }
`;

export const PIPELINE_QUERY = gql`
  ${LEAD_FIELDS}
  query Pipeline {
    pipeline {
      status
      count
      value
      leads {
        ...LeadFields
      }
    }
  }
`;

export const COMMISSIONS_QUERY = gql`
  ${COMMISSION_FIELDS}
  query Commissions($status: CommissionStatus, $repId: ID) {
    commissions(status: $status, repId: $repId) {
      ...CommissionFields
    }
  }
`;

export const REPORTS_QUERY = gql`
  query Reports {
    reports {
      monthlyRevenue {
        month
        revenue
        deals
      }
      revenueByRep {
        rep {
          id
          name
          avatarColor
        }
        revenue
        deals
        commission
      }
      payouts {
        rep {
          id
          name
          avatarColor
        }
        pending
        approved
        paid
        total
      }
    }
  }
`;

export const AUDIT_LOGS_QUERY = gql`
  query AuditLogs($limit: Int) {
    auditLogs(limit: $limit) {
      id
      action
      entityType
      entityId
      summary
      actorName
      actorRole
      createdAt
    }
  }
`;

export const CREATE_LEAD_MUTATION = gql`
  ${LEAD_FIELDS}
  mutation CreateLead($input: LeadInput!) {
    createLead(input: $input) {
      ...LeadFields
    }
  }
`;

export const UPDATE_LEAD_MUTATION = gql`
  ${LEAD_FIELDS}
  mutation UpdateLead($id: ID!, $input: LeadInput!) {
    updateLead(id: $id, input: $input) {
      ...LeadFields
    }
  }
`;

export const UPDATE_LEAD_STATUS_MUTATION = gql`
  ${LEAD_FIELDS}
  mutation UpdateLeadStatus($id: ID!, $status: LeadStatus!) {
    updateLeadStatus(id: $id, status: $status) {
      ...LeadFields
    }
  }
`;

export const APPROVE_COMMISSION_MUTATION = gql`
  ${COMMISSION_FIELDS}
  mutation ApproveCommission($id: ID!) {
    approveCommission(id: $id) {
      ...CommissionFields
    }
  }
`;

export const PAY_COMMISSION_MUTATION = gql`
  ${COMMISSION_FIELDS}
  mutation PayCommission($id: ID!) {
    payCommission(id: $id) {
      ...CommissionFields
    }
  }
`;

export const CANCEL_COMMISSION_MUTATION = gql`
  ${COMMISSION_FIELDS}
  mutation CancelCommission($id: ID!) {
    cancelCommission(id: $id) {
      ...CommissionFields
    }
  }
`;
