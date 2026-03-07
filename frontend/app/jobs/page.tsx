import { JobsPage } from "./jobs-page";
import { Suspense } from "react";
import { NavbarSpacer } from "@/components/navbar";
import { Loader2 } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <NavbarSpacer />
      <Suspense fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
      }>
        <JobsPage />
      </Suspense>
    </div>
  );
}
