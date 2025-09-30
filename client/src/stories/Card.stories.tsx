import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible card component with header, content, and footer sections. Built with Radix UI primitives.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Basic card
export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A basic card with header, title, description, and content.',
      },
    },
  },
}

// Card with footer
export const WithFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                placeholder="Name of your project"
                className="px-3 py-2 border rounded-md"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="framework">Framework</label>
              <select id="framework" className="px-3 py-2 border rounded-md">
                <option value="">Select</option>
                <option value="next">Next.js</option>
                <option value="sveltekit">SvelteKit</option>
                <option value="astro">Astro</option>
                <option value="nuxt">Nuxt.js</option>
              </select>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A card with a footer containing action buttons.',
      },
    },
  },
}

// Notification card
export const Notification: Story = {
  render: () => (
    <Card className="w-[380px]">
      <CardHeader className="pb-3">
        <CardTitle>Your Order</CardTitle>
        <CardDescription>You have 3 unread messages.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1">
        <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
          <Avatar className="mt-1 h-9 w-9">
            <AvatarImage src="/avatars/01.png" alt="Avatar" />
            <AvatarFallback>OM</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Sofia Davis</p>
            <p className="text-sm text-muted-foreground">
              sent you an invite to connect.
            </p>
          </div>
        </div>
        <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
          <Avatar className="mt-1 h-9 w-9">
            <AvatarImage src="/avatars/02.png" alt="Avatar" />
            <AvatarFallback>JL</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Jackson Lee</p>
            <p className="text-sm text-muted-foreground">
              sent you an invite to connect.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A notification card with user avatars and messages.',
      },
    },
  },
}

// Stats card
export const Stats: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M12 2v20m8-8H4" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$45,231.89</div>
          <p className="text-xs text-muted-foreground">
            +20.1% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+2350</div>
          <p className="text-xs text-muted-foreground">
            +180.1% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sales</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <path d="M2 10h20" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+12,234</div>
          <p className="text-xs text-muted-foreground">
            +19% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Now</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+573</div>
          <p className="text-xs text-muted-foreground">
            +201 since last hour
          </p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Statistics cards showing metrics with icons and trend indicators.',
      },
    },
  },
}

// Card with badges
export const WithBadges: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Project Alpha</CardTitle>
          <Badge variant="secondary">In Progress</Badge>
        </div>
        <CardDescription>
          A new project to improve user experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-medium">75%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Badge variant="outline">React</Badge>
            <Badge variant="outline">TypeScript</Badge>
            <Badge variant="outline">Tailwind</Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Details</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A card with badges showing project status and technologies.',
      },
    },
  },
}

// All card parts showcase
export const AllParts: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Card Component Parts</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Card Header</CardTitle>
            <CardDescription>This is the card header with title and description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the card content area where the main content goes.</p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">This is the card footer</p>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Minimal Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Cards can have just header and content without description or footer.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Showcase of all card component parts: Header, Content, and Footer.',
      },
    },
  },
}
