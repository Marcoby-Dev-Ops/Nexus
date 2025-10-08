import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Separator } from "@/components/ui/separator"
import { MainDashboard } from "@/components/dashboard/main-dashboard"
import { LayoutDashboard, LogOut, User } from "lucide-react"
import { useAuth } from "@/hooks/index"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function HomePage() {
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    signOut();
  };

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
            {user && (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:block">
                  {user.name || user.email}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block">Logout</span>
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