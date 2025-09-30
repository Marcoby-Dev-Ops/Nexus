import type { Meta, StoryObj } from '@storybook/react'
import { IdentityDashboard } from '../components/identity/identity-dashboard'

const meta: Meta<typeof IdentityDashboard> = {
  title: 'Identity/IdentityDashboard',
  component: IdentityDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The identity dashboard component for managing company identity, mission, vision, values, and brand positioning.',
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
        story: 'The default identity dashboard showing all identity management sections.',
      },
    },
  },
}

export const WithContent: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Identity dashboard with sample content filled in to show how it looks with data.',
      },
    },
  },
}

export const EmptyState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Identity dashboard in empty state for new companies starting their identity definition.',
      },
    },
  },
}
