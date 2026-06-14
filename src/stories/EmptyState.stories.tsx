import type { Meta, StoryObj } from "@storybook/react-vite";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

const meta = {
  title: "Library/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[36rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: Users,
    title: "No leads found",
    description: "Try adjusting your search or filters.",
  },
};

export const WithAction: Story = {
  args: {
    icon: Users,
    title: "No leads yet",
    description: "Create your first lead to get started.",
    action: <Button size="sm">New Lead</Button>,
  },
};
