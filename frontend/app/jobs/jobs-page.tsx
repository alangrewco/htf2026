"use client";

import { useIngestionData } from "@/lib/api/ingestion/use-ingestion-data";
import { IngestionRun } from "@/sdk/model";
import { Loader2, Play, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import { StartAnalysisForm } from "@/components/start-analysis-form";
import { useSearchParams } from "next/navigation";

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
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Analysis Jobs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and manage data ingestion and risk analysis tasks.
          </p>
        </div>

        <StartAnalysisForm selectedIdsFromQuery={autoSelect} />

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="text-right">Articles Processed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary/50" />
                    Loading jobs...
                  </TableCell>
                </TableRow>
              ) : runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                    No analysis jobs found.
                  </TableCell>
                </TableRow>
              ) : (
                runs.map((run: IngestionRun) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-mono text-xs max-w-[120px] truncate" title={run.id}>
                      {run.id}
                    </TableCell>
                    <TableCell>
                      {run.status === "running" && (
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 gap-1.5">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Running
                        </Badge>
                      )}
                      {run.status === "completed" && (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 gap-1.5">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </Badge>
                      )}
                      {run.status === "failed" && (
                        <Badge variant="destructive" className="gap-1.5">
                          <AlertCircle className="h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                      {run.status === "queued" && (
                        <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                          <Play className="h-3 w-3" />
                          Queued
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground flex flex-col gap-1">
                      <span>{run.created_at ? formatDistanceToNow(new Date(run.created_at), { addSuffix: true }) : "N/A"}</span>
                      {(run.status === "running" || run.status === "queued") && run.started_at && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </span>
                          <ActiveTimer startedAt={run.started_at} />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {run.stats?.articles_ingested || 0}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </>
  );
}
