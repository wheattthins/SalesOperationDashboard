import type { Meta, StoryObj } from "@storybook/react-vite";
import { DollarSign, Users, Trophy, Wallet } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

const meta = {
  title: "Library/DashboardCard",
  component: DashboardCard,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DashboardCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Revenue: Story = {
  args: {
    title: "Total Revenue",
    value: "$5,300,693",
    icon: DollarSign,
    accent: "emerald",
    hint: "from closed deals",
  },
};

export const WithTrend: Story = {
  args: {
    title: "Closed Deals",
    value: "11",
    icon: Trophy,
    accent: "primary",
    trend: { value: "17.2%", positive: true },
    hint: "win rate",
  },
};

export const Loading: Story = {
  args: { title: "Active Leads", value: "", icon: Users, accent: "sky", loading: true },
};

export const Grid = {
  render: () => (
    <div className="grid w-[40rem] grid-cols-2 gap-4">
      <DashboardCard title="Total Revenue" value="$5.3M" icon={DollarSign} accent="emerald" hint="from closed deals" />
      <DashboardCard title="Active Leads" value="41" icon={Users} accent="sky" hint="in the pipeline" />
      <DashboardCard title="Closed Deals" value="11" icon={Trophy} accent="primary" trend={{ value: "17%", positive: true }} hint="win rate" />
      <DashboardCard title="Pending Commissions" value="$105,538" icon={Wallet} accent="amber" hint="awaiting payout" />
    </div>
  ),
};
