import type { Meta, StoryObj } from '@storybook/react'
import { ChatAIAssistant } from '../components/ai/chat-ai-assistant'

const meta: Meta<typeof ChatAIAssistant> = {
  title: 'AI/ChatAIAssistant',
  component: ChatAIAssistant,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'AI chat assistant component for helping users with different sections of their business (mission, vision, purpose, values, culture, brand).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    section: {
      control: { type: 'select' },
      options: ['mission', 'vision', 'purpose', 'values', 'culture', 'brand'],
      description: 'The business section the AI is helping with',
    },
    currentValue: {
      control: { type: 'text' },
      description: 'Current value for the section',
    },
    context: {
      control: { type: 'text' },
      description: 'Additional context for the AI',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Mission: Story = {
  args: {
    section: 'mission',
    currentValue: 'To help businesses grow through technology',
    context: 'We are a technology consulting company focused on small to medium businesses.',
  },
  parameters: {
    docs: {
      description: {
        story: 'AI assistant helping with mission statement development.',
      },
    },
  },
}

export const Vision: Story = {
  args: {
    section: 'vision',
    currentValue: 'To be the leading technology partner for SMBs',
    context: 'We want to help 1000+ businesses by 2025.',
  },
  parameters: {
    docs: {
      description: {
        story: 'AI assistant helping with vision statement development.',
      },
    },
  },
}

export const Values: Story = {
  args: {
    section: 'values',
    currentValue: 'Integrity, Innovation, Customer Success',
    context: 'We value transparency, cutting-edge solutions, and long-term partnerships.',
  },
  parameters: {
    docs: {
      description: {
        story: 'AI assistant helping with company values definition.',
      },
    },
  },
}

export const Brand: Story = {
  args: {
    section: 'brand',
    currentValue: 'Professional, Reliable, Innovative',
    context: 'We want to be seen as the go-to technology experts for growing businesses.',
  },
  parameters: {
    docs: {
      description: {
        story: 'AI assistant helping with brand positioning and messaging.',
      },
    },
  },
}

export const EmptyState: Story = {
  args: {
    section: 'purpose',
    currentValue: '',
    context: 'We are just starting to define our company purpose.',
  },
  parameters: {
    docs: {
      description: {
        story: 'AI assistant starting from scratch with no current value.',
      },
    },
  },
}
