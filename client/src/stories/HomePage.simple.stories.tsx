import type { Meta, StoryObj } from '@storybook/react'
import { DashboardLayout } from '../components/dashboard/dashboard-layout'
import { MainDashboard } from '../components/dashboard/main-dashboard'
import { LayoutDashboard, User } from 'lucide-react'
import { Button } from '../shared/components/ui/Button'
import { Avatar, AvatarFallback } from '../shared/components/ui/Avatar'

// Simple version of HomePage without complex hooks
function SimpleHomePage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <h1 className="text-base font-medium flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </h1>
          <div className="ml-auto flex items-center gap-2">
            {/* User Info */}
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:block">
                John Doe
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => console.log('Logout clicked')}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-6 py-4 md:gap-8 md:py-6 px-4 lg:px-6">
            <MainDashboard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

const meta: Meta<typeof SimpleHomePage> = {
  title: 'Pages/HomePage (Simple)',
  component: SimpleHomePage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A simplified version of the home page without complex authentication hooks for Storybook demonstration.',
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
        story: 'The simplified home page showing the dashboard layout and main dashboard component.',
      },
    },
  },
}
