import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeToggleAdvanced } from "@/components/ui/theme-toggle-advanced"
import { IdentityDashboard } from "@/components/identity/identity-dashboard"
import { Building2 } from "lucide-react"

export default function IdentityPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Business Identity
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggleAdvanced />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-6 py-4 md:gap-8 md:py-6 px-4 lg:px-6">
            <IdentityDashboard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
