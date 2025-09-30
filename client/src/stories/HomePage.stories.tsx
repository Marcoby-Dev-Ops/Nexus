import type { Meta, StoryObj } from '@storybook/react'
import HomePage from '../pages/HomePage'

const meta: Meta<typeof HomePage> = {
  title: 'Pages/HomePage',
  component: HomePage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The main dashboard page showing the business overview, building blocks progress, and recent activity. Includes user authentication and navigation.',
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
        story: 'The default home page with authenticated user and dashboard content.',
      },
    },
  },
}

export const WithDifferentUser: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Home page with a different user profile.',
      },
    },
  },
}

export const WithoutUser: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Home page without authenticated user (should show login state).',
      },
    },
  },
}
