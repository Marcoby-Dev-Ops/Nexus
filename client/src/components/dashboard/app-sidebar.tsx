"use client"

import * as React from "react"
import {
  BarChart3,
  Brain,
  Building2,
  Calendar,
  CheckSquare,
  Clock,
  Database,
  DollarSign,
  FileText,
  HelpCircle,
  Home,
  LayoutDashboard,
  Lightbulb,
  Link,
  Package,
  Search,
  Settings,
  Target,
  Users,
  User,
  Wallet,
  Zap,
} from "lucide-react"
import { ThemeToggleAdvanced } from "@/components/ui/theme-toggle-advanced"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Nexus User",
    email: "user@nexus.com",
    avatar: "/avatars/user.jpg",
  },
  // Primary Navigation - Core Nexus Loop
  primaryNav: [
    {
      title: "Dashboard",
      url: "/chat",
      icon: LayoutDashboard,
    },
    {
      title: "Thoughts",
      url: "/thoughts",
      icon: Brain,
    },
    {
      title: "Plans",
      url: "/plans",
      icon: Target,
    },
    {
      title: "Actions",
      url: "/actions",
      icon: Zap,
    },
    {
      title: "Memory Timeline",
      url: "/memory",
      icon: Clock,
    },
  ],
  // Building Block Views - The 7 Core Areas
  buildingBlocks: [
    {
      title: "Identity",
      url: "/identity",
      icon: Building2,
    },
    {
      title: "Revenue",
      url: "/revenue",
      icon: DollarSign,
    },
    {
      title: "Cash",
      url: "/cash",
      icon: Wallet,
    },
    {
      title: "Delivery",
      url: "/delivery",
      icon: Package,
    },
    {
      title: "People",
      url: "/people",
      icon: Users,
    },
    {
      title: "Knowledge",
      url: "/knowledge",
      icon: FileText,
    },
    {
      title: "Systems",
      url: "/systems",
      icon: Settings,
    },
  ],
  // Supporting Sections
  supportingSections: [
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
    },
    {
      title: "Integrations",
      url: "/integrations",
      icon: Link,
    },
    {
      title: "Data Library",
      url: "/data",
      icon: Database,
    },
    {
      title: "Automation",
      url: "/automation",
      icon: Zap,
    },
  ],
  // Utility / Footer
  utility: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Help",
      url: "/help",
      icon: HelpCircle,
    },
    {
      title: "Search",
      url: "/search",
      icon: Search,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
              <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/chat">
                <Zap className="!size-5" />
                <span className="text-base font-semibold">Nexus</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Primary Navigation - Core Nexus Loop */}
        <NavSection 
          title="Primary Navigation" 
          items={data.primaryNav} 
          icon={Home}
        />
        
        {/* Building Block Views - The 7 Core Areas */}
        <NavSection 
          title="Building Blocks" 
          items={data.buildingBlocks} 
          icon={Building2}
        />
        
        {/* Supporting Sections */}
        <NavSection 
          title="Supporting" 
          items={data.supportingSections} 
          icon={BarChart3}
        />
        
        {/* Utility / Footer */}
        <NavUtility items={data.utility} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <ThemeToggleAdvanced />
          </div>
        </div>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}

function NavSection({
  title,
  items,
  icon: SectionIcon,
}: {
  title: string
  items: {
    title: string
    url: string
    icon: React.ComponentType<{ className?: string }>
  }[]
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex items-center gap-2 px-2">
        <SectionIcon className="size-4 text-sidebar-foreground/70" />
        <span className="text-xs font-medium text-sidebar-foreground/70">
          {title}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <a
            key={item.title}
            href={item.url}
            className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.title}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

function NavUtility({
  items,
  className,
}: {
  items: {
    title: string
    url: string
    icon: React.ComponentType<{ className?: string }>
  }[]
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1 p-2 ${className || ""}`}>
      <div className="px-2 text-xs font-medium text-sidebar-foreground/70 mb-1">
        Utility
      </div>
      {items.map((item) => (
        <a
          key={item.title}
          href={item.url}
          className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          <item.icon className="size-4 shrink-0" />
          <span className="truncate">{item.title}</span>
        </a>
      ))}
    </div>
  )
}

function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  return (
    <div className="flex flex-col gap-1 p-2">
      <div className="flex h-12 w-full items-center gap-2 rounded-md p-2 text-sm outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2">
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
          <span className="text-xs font-medium">NU</span>
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">{user.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        </div>
      </div>
    </div>
  )
}
