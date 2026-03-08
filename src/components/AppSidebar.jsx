import { Link, useLocation } from "wouter"
import {
  BadgeDollarSign,
  Building2,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Layers,
  Settings,
  Users,
  Wallet,
  Contact
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "./ui/Sidebar"

/* ---------------- NAV ITEMS ---------------- */

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "navigation" },
  { label: "Banks", href: "/banks", icon: Building2, section: "navigation" },
  { label: "Users", href: "/admin/users", icon: Users, section: "navigation" },
  { label: "Groups", href: "/groups", icon: Layers, section: "navigation" },
  { label: "Add Bill", href: "/add-bill", icon: BadgeDollarSign, section: "navigation" },

  { label: "Finde Contact", href: "/finde-contact", icon: Contact, section: "navigation" },
  { label: "Client All Bills", href: "/client-all-bills", icon: Wallet, section: "groups" },
  { label: "Agent Bills", href: "/agent-bills", icon: CreditCard, section: "groups" },
  { label: "Processing Payment", href: "/processing-payment", icon: ChevronRight, section: "groups" },

  { label: "Settings", href: "/dashboard#settings", icon: Settings, section: "settings" },
]

/* ---------------- SECTION COMPONENT ---------------- */

function Section({ title, children }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[11px] uppercase text-zinc-400 tracking-wider">
        {title}
      </SidebarGroupLabel>
      <SidebarGroupContent>{children}</SidebarGroupContent>
    </SidebarGroup>
  )
}

/* ---------------- NAV LINK ---------------- */

function NavLink({ item }) {
  const [location] = useLocation();
  const { toggle } = useSidebar();
  const Icon = item.icon;
  const active = location === item.href;
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active}>
        <Link href={item.href} onClick={() => setTimeout(toggle, 100)}>
          <Icon className="h-4 w-4"/>
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/* ---------------- SIDEBAR ---------------- */

export default function AppSidebar({ children }) {
  const [, setLocation] = useLocation()

  function handleSignOut() {
    localStorage.removeItem("authToken")
    localStorage.removeItem("authUser")
    setLocation("/login")
  }

  return (
    <SidebarProvider>
      <Sidebar>
        {/* Header */}
        <SidebarHeader className="px-3 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-zinc-900 text-white">
              <span className="text-sm font-semibold">B</span>
            </div>

            <div>
              <div className="text-base font-semibold">BillFlow</div>
              <div className="text-xs text-zinc-400">Billing dashboard</div>
            </div>
          </div>
        </SidebarHeader>

        {/* Content */}
        <SidebarContent className="px-2">

          {/* Admin card */}
          <div className="px-2 py-2">
            <div className="flex items-center gap-3 rounded-xl bg-zinc-100 px-3 py-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-zinc-200">
                <span className="text-sm font-semibold">A</span>
              </div>
              <div>
                <div className="text-sm font-semibold">Admin User</div>
                <div className="text-xs text-zinc-500">Admin</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <Section title="Navigation">
            <SidebarMenu>
              {navItems.filter(i => i.section==="navigation").map(item => (
                <NavLink key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </Section>

          {/* Groups */}
          <Section title="All Groups">
            <SidebarMenu>
              {navItems.filter(i => i.section==="groups").map(item => (
                <NavLink key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </Section>

          {/* Settings */}
          <Section title="Settings">
            <SidebarMenu>
              {navItems.filter(i => i.section==="settings").map(item => (
                <NavLink key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </Section>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="px-3 py-3">
          <button
            className="w-full rounded-full bg-zinc-100 px-4 py-2 text-left text-sm hover:bg-zinc-200 btn-touch"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </SidebarFooter>

      </Sidebar>

      <div className="flex-1 flex flex-col min-w-0">
        <SidebarTrigger />
        {children}
      </div>
    </SidebarProvider>
  )
}
