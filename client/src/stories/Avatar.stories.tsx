import type { Meta, StoryObj } from '@storybook/react'
import { Avatar, AvatarFallback, AvatarImage } from '../shared/components/ui/Avatar'

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'An image element with a fallback for representing the user. Built with Radix UI primitives.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Basic avatar
export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A basic avatar with an image and fallback initials.',
      },
    },
  },
}

// Avatar with fallback only
export const Fallback: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
  parameters: {
    docs: {
      description: {
        story: 'An avatar showing only the fallback when no image is provided.',
      },
    },
  },
}

// Different sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar className="h-8 w-8">
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>XS</AvatarFallback>
      </Avatar>
      <Avatar className="h-10 w-10">
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <Avatar className="h-16 w-16">
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>
      <Avatar className="h-20 w-20">
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>XL</AvatarFallback>
      </Avatar>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Avatars in different sizes using Tailwind CSS classes.',
      },
    },
  },
}

// Multiple avatars
export const Multiple: Story = {
  render: () => (
    <div className="flex -space-x-2">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://github.com/vercel.png" alt="@vercel" />
        <AvatarFallback>VC</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://github.com/nextjs.png" alt="@nextjs" />
        <AvatarFallback>NJ</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>+5</AvatarFallback>
      </Avatar>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple avatars overlapping to show team members or collaborators.',
      },
    },
  },
}

// User list
export const UserList: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium leading-none">John Doe</p>
          <p className="text-sm text-muted-foreground">john@example.com</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <Avatar>
          <AvatarImage src="https://github.com/vercel.png" alt="@vercel" />
          <AvatarFallback>VC</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium leading-none">Jane Smith</p>
          <p className="text-sm text-muted-foreground">jane@example.com</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <Avatar>
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium leading-none">Alex Brown</p>
          <p className="text-sm text-muted-foreground">alex@example.com</p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Avatars used in a user list with names and email addresses.',
      },
    },
  },
}

// Status indicators
export const WithStatus: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></div>
        </div>
        <div>
          <p className="text-sm font-medium leading-none">Online</p>
          <p className="text-sm text-muted-foreground">Active now</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Avatar>
            <AvatarImage src="https://github.com/vercel.png" alt="@vercel" />
            <AvatarFallback>VC</AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-yellow-500 border-2 border-background"></div>
        </div>
        <div>
          <p className="text-sm font-medium leading-none">Away</p>
          <p className="text-sm text-muted-foreground">Last seen 5 min ago</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Avatar>
            <AvatarFallback>AB</AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-gray-500 border-2 border-background"></div>
        </div>
        <div>
          <p className="text-sm font-medium leading-none">Offline</p>
          <p className="text-sm text-muted-foreground">Last seen 2 hours ago</p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Avatars with status indicators showing online, away, and offline states.',
      },
    },
  },
}

// Custom fallback colors
export const CustomFallbacks: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarFallback className="bg-blue-500 text-white">JD</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-green-500 text-white">JS</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-purple-500 text-white">AB</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-orange-500 text-white">CD</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-pink-500 text-white">EF</AvatarFallback>
      </Avatar>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Avatars with custom colored fallbacks for different users.',
      },
    },
  },
}

// Clickable avatar
export const Clickable: Story = {
  render: () => (
    <div className="space-y-4">
      <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all">
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <p className="text-sm text-muted-foreground">Hover to see ring effect</p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A clickable avatar with hover effects for interactive use.',
      },
    },
  },
}
