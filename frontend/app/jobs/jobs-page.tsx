"use client";

import { useIngestionData } from "@/lib/api/ingestion/use-ingestion-data";
import { IngestionRun } from "@/sdk/model";
import { Loader2, Play, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect, useMemo } from "react";
import { StartAnalysisForm } from "@/components/start-analysis-form";
import { useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const JOB_DESCRIPTIONS = [
  "Scanning regional news for global instability indicators",
  "Evaluating container shortages near major Asian ports",
  "Analyzing disruptions across 15 high-priority shipments",
  "Correlating recent geopolitical events with supplier risk",
  "Tracking potential strike impacts across European ports",
  "Processing live telemetry from connected transport vessels",
  "Assessing weather anomalies affecting key trade routes",
  "Monitoring regulatory changes in export origin countries",
];

function getJobDescription(id: string) {
  let charSum = 0;
  for (let i = 0; i < id.length; i++) {
    charSum += id.charCodeAt(i);
  }
  return JOB_DESCRIPTIONS[charSum % JOB_DESCRIPTIONS.length];
}

function ActiveTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    
    const updateTime = () => {
      const now = Date.now();
      const diff = Math.max(0, now - start);
      
      const seconds = Math.floor((diff / 1000) % 60);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      
      const parts = [];
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);
      
      setElapsed(parts.join(' '));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return <span className="font-mono text-xs tabular-nums font-medium text-blue-500">{elapsed}</span>;
}

export function JobsPage() {
  const { runs, isLoading } = useIngestionData();
  const searchParams = useSearchParams();
  const [autoSelect, setAutoSelect] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, boolean>>({
    queued: true,
    running: true,
    failed: true,
    completed: true,
  });

  const filteredAndSortedRuns = useMemo(() => {
    return (runs || [])
      .filter((run: IngestionRun) => selectedFilters[run.status] !== false)
      .sort((a: IngestionRun, b: IngestionRun) => {
        const getPriority = (status: string) => {
          if (status === "queued") return 0;
          if (status === "failed") return 1;
          if (status === "running") return 2;
          if (status === "completed") return 3;
          return 4;
        };
        const diff = getPriority(a.status) - getPriority(b.status);
        if (diff !== 0) return diff;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
  }, [runs, selectedFilters]);

  useEffect(() => {
    let active = true;
    if (searchParams.get("openModal") === "true") {
      setTimeout(() => {
         if(active) {
            setAutoSelect(true);
            window.history.replaceState({}, "", "/jobs");
         }
      }, 0);
    }
    return () => { active = false; };
  }, [searchParams]);

  return (
    <>
      <main className="w-full py-8 px-4 md:px-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analysis Jobs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor and manage data ingestion and risk analysis tasks.
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-2 px-3 border rounded-md hover:bg-muted text-sm font-medium transition-colors" aria-label="Filter jobs">
                <Filter className="h-4 w-4" />
                Filter Options
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedFilters.queued}
                onCheckedChange={(checked) => setSelectedFilters(prev => ({ ...prev, queued: checked as boolean }))}
              >
                Queued
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedFilters.failed}
                onCheckedChange={(checked) => setSelectedFilters(prev => ({ ...prev, failed: checked as boolean }))}
              >
                Failed
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedFilters.running}
                onCheckedChange={(checked) => setSelectedFilters(prev => ({ ...prev, running: checked as boolean }))}
              >
                Running
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedFilters.completed}
                onCheckedChange={(checked) => setSelectedFilters(prev => ({ ...prev, completed: checked as boolean }))}
              >
                Completed
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <StartAnalysisForm selectedIdsFromQuery={autoSelect} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-full h-48 flex flex-col items-center justify-center text-muted-foreground border rounded-xl bg-card">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary/50" />
              Loading jobs...
            </div>
          ) : filteredAndSortedRuns.length === 0 ? (
            <div className="col-span-full h-48 flex flex-col items-center justify-center text-muted-foreground border rounded-xl bg-card">
              No analysis jobs found.
            </div>
          ) : (
            filteredAndSortedRuns.map((run: IngestionRun) => {
              const desc = getJobDescription(run.id);

              return (
                <Card key={run.id} className="hover:border-primary/50 transition-colors shadow-sm">
                  <CardContent className="p-5 flex flex-col h-full gap-3">
                    <div className="flex justify-between items-start gap-4">
                      <span className="font-mono text-xs text-muted-foreground break-all" title={run.id}>
                        {run.id}
                      </span>
                      {run.status === "running" && (
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 gap-1.5 shrink-0">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Running
                        </Badge>
                      )}
                      {run.status === "completed" && (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 gap-1.5 shrink-0">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </Badge>
                      )}
                      {run.status === "failed" && (
                        <Badge variant="destructive" className="gap-1.5 shrink-0">
                          <AlertCircle className="h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                      {run.status === "queued" && (
                        <Badge variant="outline" className="gap-1.5 text-muted-foreground shrink-0">
                          <Play className="h-3 w-3" />
                          Queued
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-medium text-foreground leading-snug line-clamp-2 mt-1">
                      {desc}
                    </h3>
                    
                    <div className="mt-auto pt-4 flex items-end justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Started</span>
                        <div className="text-sm font-medium">
                          {run.created_at ? formatDistanceToNow(new Date(run.created_at), { addSuffix: true }) : "N/A"}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Processed</span>
                        <div className="text-sm font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">
                          {run.stats?.articles_ingested || 0} items
                        </div>
                      </div>
                    </div>
                    
                    {(run.status === "running" || run.status === "queued") && run.started_at && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        <span className="text-xs text-muted-foreground">Active for</span>
                        <ActiveTimer startedAt={run.started_at} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </>
  );
}
