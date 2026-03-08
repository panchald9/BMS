import * as React from "react";

function joinClasses(...parts) {
  return parts.filter(Boolean).join(" ");
}

const SidebarContext = React.createContext({ isOpen: false, toggle: () => {} });

export function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const toggle = () => setIsOpen(prev => !prev);
  
  return (
    <SidebarContext.Provider value={{ isOpen, toggle }}>
      <div className="flex min-h-screen w-full relative">{children}</div>
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return React.useContext(SidebarContext);
}

export function Sidebar({ children, className }) {
  const { isOpen, toggle } = useSidebar();
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={toggle}
        />
      )}
      
      {/* Sidebar */}
      <aside className={joinClasses(
        "fixed lg:static inset-y-0 left-0 z-50 w-[280px] sm:w-[235px] shrink-0 border-r bg-white transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}>
        <div className="flex h-full flex-col">{children}</div>
      </aside>
    </>
  );
}

export function SidebarTrigger({ className }) {
  const { toggle } = useSidebar();
  
  return (
    <button
      onClick={toggle}
      className={joinClasses(
        "lg:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-white border shadow-sm btn-touch",
        className
      )}
      aria-label="Toggle sidebar"
    >
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}

export function SidebarHeader({ children, className }) {
  return <div className={joinClasses("border-b", className)}>{children}</div>;
}

export function SidebarContent({ children, className }) {
  return <div className={joinClasses("flex-1 overflow-y-auto", className)}>{children}</div>;
}

export function SidebarFooter({ children, className }) {
  return <div className={joinClasses("border-t", className)}>{children}</div>;
}

export function SidebarGroup({ children, className }) {
  return <section className={joinClasses("mb-6", className)}>{children}</section>;
}

export function SidebarGroupLabel({ children, className }) {
  return <div className={joinClasses("mb-2 px-2 text-[11px] font-semibold tracking-wide text-zinc-400", className)}>{children}</div>;
}

export function SidebarGroupContent({ children, className }) {
  return <div className={className}>{children}</div>;
}

export function SidebarMenu({ children, className }) {
  return <ul className={joinClasses("space-y-1.5", className)}>{children}</ul>;
}

export function SidebarMenuItem({ children, className }) {
  return <li className={className}>{children}</li>;
}

export function SidebarMenuButton({
  asChild = false,
  isActive = false,
  className,
  children,
  ...props
}) {
  const baseClassName = joinClasses(
    "flex h-10 w-full items-center gap-2 rounded-xl px-3 py-2 text-sm sm:text-[15px] transition-colors btn-touch",
    isActive ? "bg-zinc-900 font-medium text-white" : "text-zinc-700 hover:bg-zinc-100",
    className
  );

  if (asChild && React.isValidElement(children)) {
    const child = React.Children.only(children);
    return React.cloneElement(child, {
      ...props,
      className: joinClasses(baseClassName, child.props.className),
    });
  }

  return (
    <button type="button" className={baseClassName} {...props}>
      {children}
    </button>
  );
}
