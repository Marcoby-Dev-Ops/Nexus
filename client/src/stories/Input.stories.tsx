import type { Meta, StoryObj } from '@storybook/react'
import { Input } from '../shared/components/ui/Input'
import { Label } from '../shared/components/ui/Label'
import { Button } from '../shared/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../shared/components/ui/Card'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A styled input component built with Radix UI primitives. Supports various input types and states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      description: 'The input type',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the input is disabled',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Basic input
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
  parameters: {
    docs: {
      description: {
        story: 'A basic input field with placeholder text.',
      },
    },
  },
}

// Input with label
export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Input field with a proper label for accessibility.',
      },
    },
  },
}

// Different input types
export const InputTypes: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <div className="grid items-center gap-1.5">
        <Label htmlFor="text">Text</Label>
        <Input type="text" id="text" placeholder="Enter text" />
      </div>
      <div className="grid items-center gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input type="email" id="email" placeholder="Enter email" />
      </div>
      <div className="grid items-center gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input type="password" id="password" placeholder="Enter password" />
      </div>
      <div className="grid items-center gap-1.5">
        <Label htmlFor="number">Number</Label>
        <Input type="number" id="number" placeholder="Enter number" />
      </div>
      <div className="grid items-center gap-1.5">
        <Label htmlFor="search">Search</Label>
        <Input type="search" id="search" placeholder="Search..." />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different input types for various use cases.',
      },
    },
  },
}

// Input states
export const States: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <div className="grid items-center gap-1.5">
        <Label htmlFor="normal">Normal</Label>
        <Input id="normal" placeholder="Normal state" />
      </div>
      <div className="grid items-center gap-1.5">
        <Label htmlFor="disabled">Disabled</Label>
        <Input id="disabled" placeholder="Disabled state" disabled />
      </div>
      <div className="grid items-center gap-1.5">
        <Label htmlFor="error">Error</Label>
        <Input id="error" placeholder="Error state" className="border-red-500" />
        <p className="text-sm text-red-500">This field is required</p>
      </div>
      <div className="grid items-center gap-1.5">
        <Label htmlFor="success">Success</Label>
        <Input id="success" placeholder="Success state" className="border-green-500" />
        <p className="text-sm text-green-500">Looks good!</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Input field in different states: normal, disabled, error, and success.',
      },
    },
  },
}

// Input with button
export const WithButton: Story = {
  render: () => (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Input type="email" placeholder="Email" />
      <Button type="submit">Subscribe</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Input field with a button for actions like subscribe or search.',
      },
    },
  },
}

// Input with icon
export const WithIcon: Story = {
  render: () => (
    <div className="relative w-full max-w-sm">
      <svg
        className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <Input type="search" placeholder="Search..." className="pl-8" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Input field with a search icon inside.',
      },
    },
  },
}

// Form example
export const FormExample: Story = {
  render: () => (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Enter your details to create a new account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid items-center gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="John Doe" />
        </div>
        <div className="grid items-center gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input type="email" id="email" placeholder="john@example.com" />
        </div>
        <div className="grid items-center gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input type="password" id="password" placeholder="••••••••" />
        </div>
        <Button className="w-full">Create Account</Button>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A complete form example using input fields with labels.',
      },
    },
  },
}

// File input
export const FileInput: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="picture">Picture</Label>
      <Input id="picture" type="file" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'File input for uploading files.',
      },
    },
  },
}

// Input sizes
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <div className="grid items-center gap-1.5">
        <Label htmlFor="small">Small</Label>
        <Input id="small" placeholder="Small input" className="h-8" />
      </div>
      <div className="grid items-center gap-1.5">
        <Label htmlFor="default">Default</Label>
        <Input id="default" placeholder="Default input" />
      </div>
      <div className="grid items-center gap-1.5">
        <Label htmlFor="large">Large</Label>
        <Input id="large" placeholder="Large input" className="h-12" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Input fields in different sizes.',
      },
    },
  },
}
