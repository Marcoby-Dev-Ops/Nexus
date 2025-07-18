import type { Meta, StoryObj } from '@storybook/react';
import AdvancedSettings from '@/domains/admin/user/pages/settings/AdvancedSettings';

const meta: Meta<typeof AdvancedSettings> = {
  title: 'Pages/Settings/AdvancedSettings',
  component: AdvancedSettings,
};

export default meta;
type Story = StoryObj<typeof AdvancedSettings>;

export const Default: Story = {
  args: {},
}; 