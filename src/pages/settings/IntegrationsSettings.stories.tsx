import type { Meta, StoryObj } from '@storybook/react';
import IntegrationsSettings from './IntegrationsSettings';

const meta: Meta<typeof IntegrationsSettings> = {
  title: 'Pages/Settings/IntegrationsSettings',
  component: IntegrationsSettings,
};

export default meta;
type Story = StoryObj<typeof IntegrationsSettings>;

export const Default: Story = {
  args: {},
}; 