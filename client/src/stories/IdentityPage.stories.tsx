import type { Meta, StoryObj } from '@storybook/react'
import IdentityPage from '../pages/IdentityPage'

const meta: Meta<typeof IdentityPage> = {
  title: 'Pages/IdentityPage',
  component: IdentityPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The business identity page for managing company identity, mission, vision, values, and brand positioning. Part of the 7 building blocks system.',
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
        story: 'The default identity page showing the business identity management interface.',
      },
    },
  },
}

export const WithContent: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Identity page with sample content filled in to show how it looks with data.',
      },
    },
  },
}

export const EmptyState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Identity page in empty state for new companies starting their identity definition.',
      },
    },
  },
}
