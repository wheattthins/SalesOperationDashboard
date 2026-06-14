import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const meta = {
  title: "Library/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    },
    size: { control: "select", options: ["default", "sm", "lg", "icon"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: "Button" } };
export const Outline: Story = { args: { variant: "outline", children: "Outline" } };
export const Destructive: Story = { args: { variant: "destructive", children: "Delete" } };

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Plus className="h-4 w-4" /> New Lead
      </>
    ),
  },
};

export const AllVariants = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};
