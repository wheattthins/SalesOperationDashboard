import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusBadge } from "@/components/shared/status-badge";

const meta = {
  title: "Library/StatusBadge",
  component: StatusBadge,
  tags: ["autodocs"],
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LeadStatus: Story = {
  args: { kind: "lead", value: "SHOWING_SCHEDULED" },
};

export const CommissionStatus: Story = {
  args: { kind: "commission", value: "APPROVED" },
};

export const RoleBadge: Story = {
  args: { kind: "role", value: "FINANCE" },
};

export const AllLeadStatuses = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["NEW_LEAD", "CONTACTED", "SHOWING_SCHEDULED", "OFFER_MADE", "CLOSED_WON", "CLOSED_LOST"] as const).map(
        (s) => (
          <StatusBadge key={s} kind="lead" value={s} />
        ),
      )}
    </div>
  ),
};
