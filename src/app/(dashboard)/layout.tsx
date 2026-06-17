import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <><AppShell>{children}</AppShell><Toaster /></>;
}