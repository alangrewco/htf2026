import { BarChart3, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { NavbarSpacer } from "@/components/navbar";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen">
      <NavbarSpacer />
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Detailed Data Dashboard</h1>
          <p className="text-muted-foreground max-w-md">
            Historical trend data, revenue projection charts, and disruption-vs-resolution
            performance graphs with interactive drill-downs.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-4">
            Coming soon — this is a placeholder page.
          </p>
        </div>
      </div>
    </div>
  );
}
