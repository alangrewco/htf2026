import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/navbar";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <TooltipProvider delayDuration={200}>
            <Navbar />
            {children}
        </TooltipProvider>
    );
}
