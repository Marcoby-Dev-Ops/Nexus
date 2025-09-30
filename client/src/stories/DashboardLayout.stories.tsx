import type { Meta, StoryObj } from '@storybook/react'
import { DashboardLayout } from '../components/dashboard/dashboard-layout'
import { MainDashboard } from '../components/dashboard/main-dashboard'

const meta: Meta<typeof DashboardLayout> = {
  title: 'Dashboard/DashboardLayout',
  component: DashboardLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The main dashboard layout component that wraps the sidebar and main content area.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: <MainDashboard />,
  },
  parameters: {
    docs: {
      description: {
        story: 'The default dashboard layout with the main dashboard as content.',
      },
    },
  },
}

export const WithCustomContent: Story = {
  args: {
    children: (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Custom Dashboard Content</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Custom Widget 1</h3>
            <p className="text-muted-foreground">This is a custom widget in the dashboard layout.</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Custom Widget 2</h3>
            <p className="text-muted-foreground">Another custom widget showing the layout flexibility.</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Custom Widget 3</h3>
            <p className="text-muted-foreground">The layout adapts to different content types.</p>
          </div>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Dashboard layout with custom content to show how it adapts to different page types.',
      },
    },
  },
}
