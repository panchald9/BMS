import * as React from "react";

function joinClasses(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function SidebarProvider({ children }) {
  return <div className="flex min-h-screen w-full">{children}</div>;
}

export function Sidebar({ children, className }) {
  return (
    <aside className={joinClasses("w-[235px] shrink-0 border-r bg-white", className)}>
      <div className="flex h-full flex-col">{children}</div>
    </aside>
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
    "flex h-10 w-full items-center gap-2 rounded-xl px-3 py-2 text-[15px] transition-colors",
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
