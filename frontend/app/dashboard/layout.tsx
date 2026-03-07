import { Navbar } from "@/components/navbar";
import { MockProvider } from "@/components/mock-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MockProvider>
      <Navbar />
      {children}
    </MockProvider>
  );
}
