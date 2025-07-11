import type { Meta, StoryObj } from '@storybook/react';
import DataPrivacySettings from './DataPrivacySettings';

const meta: Meta<typeof DataPrivacySettings> = {
  title: 'Pages/Settings/DataPrivacySettings',
  component: DataPrivacySettings,
};

export default meta;
type Story = StoryObj<typeof DataPrivacySettings>;

export const Default: Story = {
  args: {},
}; 