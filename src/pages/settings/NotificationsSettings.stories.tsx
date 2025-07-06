import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import NotificationsSettings from './NotificationsSettings';

const meta: Meta<typeof NotificationsSettings> = {
  title: 'Settings/NotificationsSettings',
  component: NotificationsSettings,
  parameters: {
    docs: {
      description: {
        component: 'A settings panel for managing notification preferences (email, push, in-app). Includes toggles, save button, and analytics tracking. Ready for backend integration.'
      }
    }
  }
};
export default meta;

type Story = StoryObj<typeof NotificationsSettings>;

export const Default: Story = {
  render: () => <NotificationsSettings />,
}; 