import React from 'react';
import EnhancedDashboard from './EnhancedDashboard';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof EnhancedDashboard> = {
  title: 'Dashboard/EnhancedDashboard',
  component: EnhancedDashboard,
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof EnhancedDashboard>;

export const Default: Story = {
  render: () => <EnhancedDashboard />,
}; 