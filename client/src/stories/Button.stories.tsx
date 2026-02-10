import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../shared/components/ui/Button'
import { Download, Heart, Settings, User } from 'lucide-react'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants and sizes, built with Radix UI and class-variance-authority.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'The visual style variant of the button',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'The size of the button',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled',
    },
    asChild: {
      control: { type: 'boolean' },
      description: 'Render as a child component using Radix Slot',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default story
export const Default: Story = {
  args: {
    children: 'Button',
  },
}

// Variants showcase
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available button variants with their default styling.',
      },
    },
  },
}

// Sizes showcase
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different button sizes available.',
      },
    },
  },
}

// Icon buttons
export const IconButtons: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="icon" variant="outline">
        <Settings className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="default">
        <Download className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="destructive">
        <Heart className="h-4 w-4" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon-only buttons using the icon size variant.',
      },
    },
  },
}

// Buttons with icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button>
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
      <Button variant="outline">
        <User className="mr-2 h-4 w-4" />
        Profile
      </Button>
      <Button variant="secondary">
        <Settings className="mr-2 h-4 w-4" />
        Settings
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with icons and text.',
      },
    },
  },
}

// Disabled states
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button disabled>Disabled Default</Button>
      <Button disabled variant="destructive">Disabled Destructive</Button>
      <Button disabled variant="outline">Disabled Outline</Button>
      <Button disabled variant="secondary">Disabled Secondary</Button>
      <Button disabled variant="ghost">Disabled Ghost</Button>
      <Button disabled variant="link">Disabled Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button variants in their disabled state.',
      },
    },
  },
}

// Interactive states
export const Interactive: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Button onClick={() => alert('Clicked!')}>Click Me</Button>
        <Button variant="outline" onClick={() => console.log('Outline clicked')}>
          Console Log
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Check the Actions tab to see click events, or open browser console for the outline button.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Interactive buttons with click handlers. Check the Actions tab for event logs.',
      },
    },
  },
}

// Full showcase
export const Showcase: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Variants</h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Sizes</h3>
        <div className="flex items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">With Icons</h3>
        <div className="flex flex-wrap gap-4">
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
          <Button variant="secondary">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete showcase of all button variants, sizes, and icon combinations.',
      },
    },
  },
}
