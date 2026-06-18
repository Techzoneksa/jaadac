import { PrintLayout } from "@/components/layout/PrintLayout";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <PrintLayout>{children}</PrintLayout>;
}
