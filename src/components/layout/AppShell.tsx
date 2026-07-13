import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { toast } from "sonner";
const navItems = [
  { label: "Dashboard", icon: "dashboard", to: "/" },
  { label: "Workspaces", icon: "folder", to: "/workspaces" },
  { label: "Lead Lists", icon: "format_list_bulleted", to: "/lead-lists" },
  { label: "Leads", icon: "groups", to: "/leads" },
  { label: "Find Leads", icon: "person_search", to: "/automations" },
  { label: "Campaigns", icon: "campaign", to: "/campaigns" },
  { label: "AI Calls", icon: "record_voice_over", to: "/calls" },
  { label: "Meetings", icon: "calendar_month", to: "/meetings" },
  { label: "Proposals", icon: "description", to: "/proposals" },
  { label: "Analytics", icon: "analytics", to: "/analytics" },
] as const;

export function AppShell({
  children,
  searchPlaceholder = "Search leads, companies, or insights...",
  showAiBadge = false,
  searchValue,
  onSearchChange,
}: {
  children: ReactNode;
  searchPlaceholder?: string;
  showAiBadge?: boolean;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-background lg:pl-64 flex flex-col">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`h-screen w-64 fixed left-0 top-0 flex flex-col bg-primary border-r border-outline-variant p-4 z-50 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between gap-3 mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary-fixed rounded-lg flex items-center justify-center text-primary">
              <Icon name="hub" filled />
            </div>
            <div>
              <h1 className="text-secondary-fixed text-headline-sm font-bold leading-tight">OMNISALES AI</h1>
              <p className="text-primary-fixed-dim text-label-md font-semibold uppercase tracking-wider">Fastigo AI</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-primary-fixed-dim hover:text-white p-2 rounded-full hover:bg-primary-container/50 transition-colors"
          >
            <Icon name="close" />
          </button>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={
                  active
                    ? "flex items-center gap-3 bg-primary-container text-on-primary-container rounded-lg px-4 py-3"
                    : "flex items-center gap-3 text-primary-fixed-dim hover:text-white px-4 py-3 hover:bg-primary-container/50 transition-colors rounded-lg"
                }
              >
                <Icon name={item.icon} filled={active && item.icon === "psychology"} />
                <span className="text-label-md font-semibold">{item.label}</span>
              </Link>
            );
          })}

        </nav>
        <div className="mt-auto pt-4 border-t border-primary-container/40">
          <button 
            onClick={() => toast.info("New Lead Creation coming soon!", { id: "new-lead" })}
            className="w-full bg-secondary-container text-on-secondary-fixed py-3 rounded-lg text-label-md font-bold mb-3 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Icon name="add" />
            New Lead
          </button>
          <Link to="/settings" className="flex items-center gap-3 text-primary-fixed-dim hover:text-white px-4 py-3 hover:bg-primary-container/50 transition-colors rounded-lg">
            <Icon name="settings" />
            <span className="text-label-md font-semibold">Settings</span>
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-40 bg-surface h-16 border-b border-outline-variant flex justify-between items-center px-4 lg:px-8">
        <div className="flex items-center gap-2 lg:gap-4 flex-1">
          <button 
            className="lg:hidden p-2 -ml-2 text-on-surface-variant hover:bg-surface-container rounded-full"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <div className="relative w-full max-w-md hidden md:block">
            <button
              onClick={() => setOpen(true)}
              className="w-full flex items-center justify-between bg-surface-container-low border border-outline-variant hover:border-primary/50 hover:bg-surface-container transition-colors rounded-full py-2 pl-4 pr-4 text-body-sm text-on-surface-variant focus:outline-none"
            >
              <span className="flex items-center gap-2">
                <Icon name="search" />
                Search leads, campaigns, or insights...
              </span>
              <kbd className="hidden sm:inline-block px-2 py-0.5 rounded bg-surface border border-outline-variant/30 text-[10px] font-semibold text-on-surface-variant font-mono">
                ⌘K
              </kbd>
            </button>
          </div>
          <h2 className="lg:hidden text-title-md font-bold text-primary truncate">Bharat Sales Intel</h2>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          {showAiBadge && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-tertiary-fixed/30 rounded-full border border-tertiary-fixed-dim">
              <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse" />
              <span className="text-label-md text-on-tertiary-fixed-variant font-semibold">AI Active</span>
            </div>
          )}
          <button 
            onClick={() => toast.info("No new notifications", { id: "notifs" })}
            className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all relative"
          >
            <Icon name="notifications" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
          </button>
          <button 
            onClick={() => toast.info("Profile & Account settings coming soon", { id: "profile" })}
            className="h-9 w-9 rounded-full bg-primary-container flex items-center justify-center text-secondary-fixed font-bold text-sm hover:opacity-80 transition-opacity"
          >
            AS
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-8 pb-8">{children}</main>

      {/* CMDK Global Search */}
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Global Command Menu"
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
      >
        <div className="bg-surface-container border border-outline shadow-2xl rounded-xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center border-b border-outline-variant/50 px-3">
            <Icon name="search" className="text-on-surface-variant ml-2" />
            <Command.Input
              placeholder="Search for leads, campaigns, or actions..."
              className="w-full bg-transparent border-none focus:ring-0 text-body-lg text-on-surface py-4 px-3 outline-none placeholder:text-on-surface-variant"
            />
            <div className="text-[10px] bg-surface-container-highest px-2 py-1 rounded font-mono text-on-surface-variant">ESC</div>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
            <Command.Empty className="py-6 text-center text-on-surface-variant text-body-md">
              No results found.
            </Command.Empty>

            <Command.Group heading={<span className="px-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Navigation</span>}>
              {navItems.map(item => (
                <Command.Item
                  key={item.label}
                  value={item.label}
                  onSelect={() => {
                    window.location.href = item.to;
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:text-primary cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-on-surface text-body-md transition-colors"
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading={<span className="px-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 mt-4 block">Quick Actions</span>}>
              <Command.Item
                onSelect={() => {
                  setOpen(false);
                  toast.info("New Lead Creation coming soon!", { id: "new-lead-cmd" });
                }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:text-primary cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-on-surface text-body-md transition-colors"
              >
                <Icon name="add" />
                Add New Lead
              </Command.Item>
              <Command.Item
                onSelect={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:text-primary cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-on-surface text-body-md transition-colors"
              >
                <Icon name="campaign" />
                Create Sequence
              </Command.Item>
            </Command.Group>
          </Command.List>
        </div>
      </Command.Dialog>
    </div>
  );
}
