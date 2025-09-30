import type { Meta, StoryObj } from '@storybook/react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A modal dialog component built with Radix UI. Perfect for forms, confirmations, and content that needs user attention.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Basic dialog
export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value="Pedro Duarte" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input id="username" value="@peduarte" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A basic dialog with form fields and action buttons.',
      },
    },
  },
}

// Confirmation dialog
export const Confirmation: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account
            and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete Account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A confirmation dialog for destructive actions.',
      },
    },
  },
}

// Simple dialog
export const Simple: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Show Details</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Project Details</DialogTitle>
          <DialogDescription>
            Here are the details for your current project.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Project Name:</span>
              <span>Nexus Dashboard</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span className="text-green-600">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Progress:</span>
              <span>75%</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Team Size:</span>
              <span>5 members</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A simple dialog displaying information without form fields.',
      },
    },
  },
}

// Large dialog
export const Large: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Large Dialog</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill out the form below to create a new project for your team.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project-name" className="text-right">
              Project Name
            </Label>
            <Input id="project-name" placeholder="Enter project name" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input id="description" placeholder="Enter description" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="team-size" className="text-right">
              Team Size
            </Label>
            <Input id="team-size" type="number" placeholder="5" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="budget" className="text-right">
              Budget
            </Label>
            <Input id="budget" type="number" placeholder="10000" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Create Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A larger dialog with more form fields for complex data entry.',
      },
    },
  },
}

// Alert dialog
export const Alert: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Show Alert</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Important Notice</DialogTitle>
          <DialogDescription>
            Your session will expire in 5 minutes. Please save your work to avoid losing any changes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Logout Now</Button>
          <Button>Continue Working</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'An alert dialog for important notifications or warnings.',
      },
    },
  },
}

// Dialog without footer
export const NoFooter: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">View Image</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Project Screenshot</DialogTitle>
          <DialogDescription>
            Here's a preview of the current project design.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground">Image Preview</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A dialog without footer buttons, useful for displaying content.',
      },
    },
  },
}

// Multiple dialogs
export const Multiple: Story = {
  render: () => (
    <div className="flex gap-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Dialog 1</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>First Dialog</DialogTitle>
            <DialogDescription>
              This is the first dialog example.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Dialog 2</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Second Dialog</DialogTitle>
            <DialogDescription>
              This is the second dialog example.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple dialogs can be used on the same page.',
      },
    },
  },
}
