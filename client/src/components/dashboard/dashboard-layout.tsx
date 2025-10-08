import { AppSidebar } from "./app-sidebar"
import { PageHeader } from "./page-header"
import { HeaderProvider } from "@/shared/hooks/useHeaderContext"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <HeaderProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "16rem",
            "--header-height": "3rem",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <PageHeader />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </HeaderProvider>
  )
}
