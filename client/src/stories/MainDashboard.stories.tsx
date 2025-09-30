import type { Meta, StoryObj } from '@storybook/react'
import { MainDashboard } from '../components/dashboard/main-dashboard'

const meta: Meta<typeof MainDashboard> = {
  title: 'Dashboard/MainDashboard',
  component: MainDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The main dashboard component showing business health overview, building blocks progress, and recent activity.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The default dashboard view showing overall business health and the 7 building blocks.',
      },
    },
  },
}

export const WithHighHealth: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with high business health score (90%) to show success state.',
      },
    },
  },
}

export const WithLowHealth: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Dashboard with low business health score (30%) to show areas needing attention.',
      },
    },
  },
}
