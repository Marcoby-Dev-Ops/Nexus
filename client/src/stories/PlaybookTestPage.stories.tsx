import type { Meta, StoryObj } from '@storybook/react'
import PlaybookTestPage from '../pages/PlaybookTestPage'

const meta: Meta<typeof PlaybookTestPage> = {
  title: 'Pages/PlaybookTestPage',
  component: PlaybookTestPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A test page for the playbook viewer component, demonstrating the comprehensive playbook interaction system for business onboarding.',
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
        story: 'The default playbook test page showing the Nexus Business Onboarding Journey.',
      },
    },
  },
}

export const Interactive: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Interactive playbook test page where you can complete steps and see the completion flow.',
      },
    },
  },
}
