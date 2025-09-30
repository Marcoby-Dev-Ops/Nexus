import type { Meta, StoryObj } from '@storybook/react'
import { AppSidebar } from '../components/dashboard/app-sidebar'
import { SidebarProvider } from '../components/ui/sidebar'

const meta: Meta<typeof AppSidebar> = {
  title: 'Dashboard/AppSidebar',
  component: AppSidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The main application sidebar with navigation for the Nexus platform, including primary navigation, building blocks, and utility sections.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SidebarProvider>
        <div className="flex h-screen">
          <Story />
          <div className="flex-1 p-4">
            <h2 className="text-lg font-semibold">Main Content Area</h2>
            <p className="text-muted-foreground">This is where the main content would appear when the sidebar is in use.</p>
          </div>
        </div>
      </SidebarProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The default sidebar with all navigation sections: Primary Navigation, Building Blocks, Supporting sections, and Utility.',
      },
    },
  },
}

export const Collapsed: Story = {
  args: {
    collapsible: 'icon',
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar in collapsed/icon mode showing only icons.',
      },
    },
  },
}

export const Offcanvas: Story = {
  args: {
    collapsible: 'offcanvas',
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar in offcanvas mode that can be toggled on mobile devices.',
      },
    },
  },
}
