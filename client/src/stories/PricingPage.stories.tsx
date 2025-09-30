import type { Meta, StoryObj } from '@storybook/react'
import PricingPage from '../pages/PricingPage'

const meta: Meta<typeof PricingPage> = {
  title: 'Pages/PricingPage',
  component: PricingPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The pricing page showcasing different subscription plans (Starter, Professional, Enterprise) with features, pricing, and FAQ section.',
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
        story: 'The default pricing page with all three subscription tiers and FAQ section.',
      },
    },
  },
}

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Pricing page optimized for mobile devices.',
      },
    },
  },
}

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Pricing page on tablet viewport.',
      },
    },
  },
}
