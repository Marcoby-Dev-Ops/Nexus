import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '../shared/components/ui/Badge'

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A small status descriptor for UI elements. Used to highlight important information or categorize content.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'destructive', 'outline'],
      description: 'The visual style variant of the badge',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Basic badge
export const Default: Story = {
  args: {
    children: 'Badge',
  },
  parameters: {
    docs: {
      description: {
        story: 'A basic badge with default styling.',
      },
    },
  },
}

// All variants
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available badge variants with their default styling.',
      },
    },
  },
}

// Status badges
export const Status: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Active</Badge>
      <Badge variant="secondary">Pending</Badge>
      <Badge variant="destructive">Failed</Badge>
      <Badge variant="outline">Draft</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges commonly used for status indicators.',
      },
    },
  },
}

// Technology badges
export const Technologies: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline">React</Badge>
      <Badge variant="outline">TypeScript</Badge>
      <Badge variant="outline">Tailwind CSS</Badge>
      <Badge variant="outline">Next.js</Badge>
      <Badge variant="outline">Node.js</Badge>
      <Badge variant="outline">PostgreSQL</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges used to display technology stacks or skills.',
      },
    },
  },
}

// Priority badges
export const Priority: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="destructive">High Priority</Badge>
      <Badge variant="default">Medium Priority</Badge>
      <Badge variant="secondary">Low Priority</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges used to indicate priority levels.',
      },
    },
  },
}

// Count badges
export const Count: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">5</Badge>
      <Badge variant="secondary">12</Badge>
      <Badge variant="destructive">99+</Badge>
      <Badge variant="outline">1</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges used to display counts or numbers.',
      },
    },
  },
}

// With icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Verified
      </Badge>
      <Badge variant="destructive">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        Error
      </Badge>
      <Badge variant="secondary">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        Pending
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges with icons to enhance visual meaning.',
      },
    },
  },
}

// Custom colors
export const CustomColors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-blue-500 hover:bg-blue-600">Blue</Badge>
      <Badge className="bg-green-500 hover:bg-green-600">Green</Badge>
      <Badge className="bg-purple-500 hover:bg-purple-600">Purple</Badge>
      <Badge className="bg-orange-500 hover:bg-orange-600">Orange</Badge>
      <Badge className="bg-pink-500 hover:bg-pink-600">Pink</Badge>
      <Badge className="bg-indigo-500 hover:bg-indigo-600">Indigo</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges with custom colors using Tailwind CSS classes.',
      },
    },
  },
}

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge className="text-xs px-1.5 py-0.5">Small</Badge>
      <Badge>Default</Badge>
      <Badge className="text-sm px-3 py-1">Large</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges in different sizes using custom Tailwind classes.',
      },
    },
  },
}

// In context
export const InContext: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <h3 className="font-semibold">Project Alpha</h3>
          <p className="text-sm text-muted-foreground">A new dashboard project</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">Active</Badge>
          <Badge variant="outline">React</Badge>
        </div>
      </div>
      
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <h3 className="font-semibold">Project Beta</h3>
          <p className="text-sm text-muted-foreground">Mobile app development</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">In Progress</Badge>
          <Badge variant="outline">React Native</Badge>
        </div>
      </div>
      
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <h3 className="font-semibold">Project Gamma</h3>
          <p className="text-sm text-muted-foreground">API integration</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive">Blocked</Badge>
          <Badge variant="outline">Node.js</Badge>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges used in context with other UI elements like cards and lists.',
      },
    },
  },
}
