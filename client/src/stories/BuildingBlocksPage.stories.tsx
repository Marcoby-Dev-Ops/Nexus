import type { Meta, StoryObj } from '@storybook/react'
import BuildingBlocksPage from '../pages/building-blocks/index'

const meta: Meta<typeof BuildingBlocksPage> = {
  title: 'Pages/BuildingBlocksPage',
  component: BuildingBlocksPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The main building blocks page showcasing the 7 fundamental building blocks of business success. Features onboarding flow for new users and dashboard for returning users.',
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
        story: 'The default building blocks page for returning users with dashboard experience.',
      },
    },
  },
}

export const NewUser: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Building blocks page for new users with onboarding flow and getting started checklist.',
      },
    },
  },
}

export const WithProfile: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Building blocks page with complete user profile data.',
      },
    },
  },
}

export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Building blocks page in loading state.',
      },
    },
  },
}
