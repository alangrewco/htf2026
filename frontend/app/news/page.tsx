"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useListArticles, useGetArticleEnrichment } from "@/sdk/articles/articles";
import { NavbarSpacer } from "@/components/navbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertTriangle, 
  Calendar, 
  Globe2, 
  MapPin, 
  Link as LinkIcon,
  Activity,
  Package,
  Truck,
  Building2,
  AlertCircle,
  Newspaper,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Article, Enrichment } from "@/sdk/model";

const getRiskColor = (level: string | undefined) => {
  switch (level?.toLowerCase()) {
    case "high":
      return "text-destructive border-destructive bg-destructive/10";
    case "medium":
      return "text-orange-500 border-orange-500 bg-orange-500/10";
    case "low":
      return "text-green-500 border-green-500 bg-green-500/10";
    default:
      return "text-muted-foreground border-muted-foreground bg-muted-foreground/10";
  }
};

const getProcessingStateBadge = (state: string) => {
  switch (state.toLowerCase()) {
    case "evaluated":
    case "proposal_generated":
      return <Badge variant="default" className="bg-green-600/20 text-green-600 border-green-600/30">Actionable</Badge>;
    case "enriched":
      return <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 bg-yellow-500/10 capitalize">Enriched</Badge>;
    case "irrelevant":
      return <Badge variant="secondary" className="text-muted-foreground bg-gray-500/10 border-gray-500/30">Ignored</Badge>;
    case "raw":
      return <Badge variant="outline" className="text-blue-500 border-blue-500/30 bg-blue-500/10 capitalize">Raw</Badge>;
    default:
      return <Badge variant="outline" className="text-blue-500 border-blue-500/30 bg-blue-500/10 capitalize">{state}</Badge>;
  }
};

export default function NewsPage() {
  const { data: articlesResponse, isLoading: isLoadingArticles } = useListArticles();
  
  const [selectedFilters, setSelectedFilters] = useState<Record<string, boolean>>({
    actionable: true,
    enriched: true,
    ignored: true,
    raw: true,
  });

  const articles = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawArticles = (articlesResponse?.data as any)?.items as Article[] || [];
    return rawArticles
      .filter((a: Article) => {
        const state = a.processing_state.toLowerCase();
        if (["evaluated", "proposal_generated"].includes(state)) return selectedFilters.actionable;
        if (state === "enriched") return selectedFilters.enriched;
        if (state === "irrelevant") return selectedFilters.ignored;
        if (state === "raw") return selectedFilters.raw;
        return true;
      })
      .sort((a: Article, b: Article) => {
        const getPriority = (state: string) => {
          const s = state.toLowerCase();
          if (["evaluated", "proposal_generated"].includes(s)) return 0;
          if (s === "enriched") return 1;
          if (s === "irrelevant") return 2;
          if (s === "raw") return 3;
          return 4;
        };
        const diff = getPriority(a.processing_state) - getPriority(b.processing_state);
        if (diff !== 0) return diff;
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      });
  }, [articlesResponse?.data, selectedFilters]);
  
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  // Auto-select first article when loaded
  const currentSelection = selectedArticleId || (articles.length > 0 ? articles[0].id : null);
  const selectedArticle = articles.find((a: Article) => a.id === currentSelection);

  const { data: enrichmentResponse, isLoading: isLoadingEnrichment } = useGetArticleEnrichment(
    currentSelection ?? "", 
    { swr: { enabled: !!currentSelection } }
  );
  const enrichment = enrichmentResponse?.data as Enrichment;

  const [leftNavCollapsed, setLeftNavCollapsed] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  return (
    <div className="h-screen max-h-screen bg-background flex flex-col overflow-hidden">
      <NavbarSpacer />
      
      <main className="flex-1 flex flex-col pt-4 md:pt-6 overflow-hidden">
        {/* Header Section */}
        <div className={cn(
          "container max-w-[1600px] mx-auto px-4 md:px-6 shrink-0 transition-all duration-300 ease-in-out border-b h-auto",
          headerCollapsed ? "py-2" : "py-4 md:py-6"
        )}>
          <div className="flex justify-between items-center gap-4 relative">
            {!headerCollapsed ? (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 w-full">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">News Dashboard</h1>
                    <p className="text-muted-foreground max-w-2xl">
                      Monitor real-time shipping disruptions, assess global supply chain risks, and proactively manage exposure across your SKUs, shipments, and suppliers.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-bold">{isLoadingArticles ? "-" : articles.length}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Active Alerts</span>
                    </div>
                    <div className="h-10 w-px bg-border mx-2" />
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-bold text-destructive">
                        {isLoadingArticles ? "-" : articles.filter((a: Article) => ['evaluated', 'proposal_generated'].includes(a.processing_state)).length}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">High Priority</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setHeaderCollapsed(true)}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors self-start"
                  title="Collapse header"
                >
                  <ChevronUp className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-4">
                  <h1 className="text-xl font-bold tracking-tight">News Dashboard</h1>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Badge variant="outline" className="h-5 py-0 px-1.5">{articles.length}</Badge> Active</span>
                    <span className="flex items-center gap-1"><Badge variant="destructive" className="h-5 py-0 px-1.5">{articles.filter((a: Article) => ['evaluated', 'proposal_generated'].includes(a.processing_state)).length}</Badge> Priority</span>
                  </div>
                </div>
                <button 
                  onClick={() => setHeaderCollapsed(false)}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Expand header"
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Split Pane Interface */}
        <div className="flex-1 w-full bg-background flex overflow-hidden min-h-0 relative">
          
          {/* Left Pane: Article Feed (Static Sider) */}
          <div className={cn(
            "h-full bg-card/50 flex flex-col border-r shadow-[2px_0_8px_-4px_rgba(0,0,0,0.1)] z-20 shrink-0 transition-all duration-300 ease-in-out",
            leftNavCollapsed ? "w-[70px]" : "w-[350px] lg:w-[400px]"
          )}>
            <div className="sticky top-0 p-4 border-b bg-card flex items-center justify-between shadow-sm z-20 shrink-0 min-w-0 h-[69px]">
              {!leftNavCollapsed && (
                <div className="flex w-full items-center justify-between min-w-0">
                  <h2 className="font-semibold text-lg flex items-center gap-2 truncate">
                    <Globe2 className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span className="truncate">Live Feed</span>
                  </h2>
                  <div className="flex items-center shrink-0 ml-2 gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="Filter feed">
                          <Filter className="h-5 w-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Filter by State</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                          checked={selectedFilters.actionable}
                          onCheckedChange={(checked) => setSelectedFilters(prev => ({ ...prev, actionable: checked as boolean }))}
                        >
                          Actionable
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={selectedFilters.enriched}
                          onCheckedChange={(checked) => setSelectedFilters(prev => ({ ...prev, enriched: checked as boolean }))}
                        >
                          Enriched
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={selectedFilters.ignored}
                          onCheckedChange={(checked) => setSelectedFilters(prev => ({ ...prev, ignored: checked as boolean }))}
                        >
                          Ignored
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={selectedFilters.raw}
                          onCheckedChange={(checked) => setSelectedFilters(prev => ({ ...prev, raw: checked as boolean }))}
                        >
                          Raw
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <button 
                      onClick={() => setLeftNavCollapsed(true)} 
                      className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" 
                      aria-label="Collapse feed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
              {leftNavCollapsed && (
                <button 
                  onClick={() => setLeftNavCollapsed(false)} 
                  className="mx-auto p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" 
                  aria-label="Expand feed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
            
            <ScrollArea className="flex-1 h-full bg-card/20">
                {isLoadingArticles ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse bg-muted/20">
                        <CardHeader className="p-4">
                          <div className="h-4 w-1/4 mb-2 bg-muted rounded" />
                          <div className="h-5 w-full bg-muted rounded" />
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : articles.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    <p>No active alerts.</p>
                  </div>
                ) : (
                  <div className="divide-y relative">
                    {articles.map((article: Article) => {
                      const isSelected = article.id === currentSelection;
                      return (
                        <div
                          key={article.id}
                          onClick={() => setSelectedArticleId(article.id)}
                          className={cn(
                            "p-4 cursor-pointer transition-all hover:bg-accent/50 group",
                            isSelected ? "bg-accent/80 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                          )}
                        >
                          {!leftNavCollapsed ? (
                            <>
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate mr-2">
                                  {article.source_name || article.source}
                                </span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {format(new Date(article.published_at), "MMM d, HH:mm")}
                                </span>
                              </div>
                              <h3 className={cn("font-medium mb-2 leading-tight group-hover:text-primary transition-colors", isSelected ? "text-foreground" : "text-foreground/80")}>
                                {article.headline}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                                {article.preview_text}
                              </p>
                              <div className="flex flex-wrap gap-2 items-center mt-auto">
                                {getProcessingStateBadge(article.processing_state)}
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-center items-center py-2 h-full" title={article.headline}>
                              <Activity className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
          </div>

          {/* Resizable Area */}
          <div className="flex-1 h-full min-w-0">
            <ResizablePanelGroup orientation="horizontal" className="h-full w-full">

              {/* Middle Pane: Analysis & Impact */}
            <ResizablePanel defaultSize={rightPanelOpen && selectedArticle?.source_url ? 40 : 70} minSize={30}>
              <div className="flex flex-col h-full bg-background relative overflow-hidden">
                {!selectedArticle ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                    <Newspaper className="h-12 w-12 mb-4 opacity-20" />
                    <p>Select an article from the feed to view full analysis and supply chain impact.</p>
                  </div>
                ) : (
                  <ScrollArea className="flex-1 h-full w-full">
                    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto pb-16">
                      
                      {/* Article Header */}
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          {getProcessingStateBadge(selectedArticle.processing_state)}
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(selectedArticle.published_at), "PPPP 'at' p")}
                          </span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-4 leading-tight">
                          {selectedArticle.title}
                        </h1>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex flex-wrap items-center gap-4">
                              <span className="font-semibold text-foreground text-base">
                                {selectedArticle.source_name || selectedArticle.source}
                              </span>
                              {selectedArticle.tags?.slice(0, 3).map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="px-2 py-0.5 text-xs font-normal capitalize">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            
                            {!rightPanelOpen && selectedArticle?.source_url && (
                              <button
                                onClick={() => setRightPanelOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors shrink-0 whitespace-nowrap"
                                title="Reopen Source"
                              >
                                <LinkIcon className="h-3.5 w-3.5" />
                                Reopen Source
                              </button>
                            )}
                        </div>
                      </div>

                      <Separator className="bg-border/60" />

                      {/* AI Analysis Section */}
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2 tracking-tight">
                          <Activity className="h-5 w-5 text-primary" />
                          Platform Analysis
                        </h3>
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 shadow-sm">
                          <p className="text-base leading-relaxed text-foreground/90">
                            {selectedArticle.analysis || selectedArticle.summary}
                          </p>
                        </div>
                      </div>

                      {/* Enrichment Data (Risk & Impact) */}
                      <div className="space-y-4 mt-8">
                        <h3 className="text-xl font-semibold flex items-center gap-2 tracking-tight">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          Supply Chain Impact Assessment
                        </h3>

                        {isLoadingEnrichment ? (
                          <div className="space-y-4 animate-pulse pt-2">
                            <div className="h-32 w-full rounded-xl bg-muted/50 border" />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="h-28 w-full bg-muted/50 rounded-xl border" />
                              <div className="h-28 w-full bg-muted/50 rounded-xl border" />
                              <div className="h-28 w-full bg-muted/50 rounded-xl border" />
                            </div>
                          </div>
                        ) : enrichment && enrichment.is_relevant ? (
                          <div className="space-y-6 pt-2">
                            {/* Status Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Risk Level */}
                              <Card className="shadow-sm">
                                <CardContent className="p-5 flex flex-col gap-2 h-full">
                                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Computed Risk</span>
                                  <div className="flex items-end gap-3 mt-auto">
                                    <span className={cn("text-3xl font-bold capitalize", getRiskColor(enrichment.risk_level).split(" ")[0])}>
                                      {enrichment.risk_level}
                                    </span>
                                    <span className="text-sm text-muted-foreground mb-1 font-medium">
                                      Score: {enrichment.risk_score}/100
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Impact Horizon */}
                              <Card className="shadow-sm">
                                <CardContent className="p-5 flex flex-col gap-2 h-full">
                                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Impact Window</span>
                                  <div className="flex flex-col mt-auto">
                                    <span className="font-semibold text-lg text-foreground capitalize">
                                      {enrichment.horizon.replace("_", " ")}
                                    </span>
                                    <span className="text-sm text-muted-foreground mt-1">
                                      {format(new Date(enrichment.impact_window.start_at), "MMM d")} - {format(new Date(enrichment.impact_window.end_at), "MMM d, yyyy")}
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Geolocation */}
                              <Card className="md:col-span-2 lg:col-span-1 shadow-sm">
                                <CardContent className="p-5 flex flex-col gap-2 h-full">
                                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" /> Affected Regions
                                  </span>
                                  <div className="flex flex-wrap gap-2 mt-auto">
                                    {enrichment.geo?.ports?.map((port: string) => (
                                      <Badge key={port} variant="outline" className="border-border bg-background">Port of {port}</Badge>
                                    ))}
                                    {enrichment.geo?.countries?.map((country: string) => (
                                      <Badge key={country} variant="secondary" className="bg-muted/50">{country}</Badge>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Affected Entities */}
                            <div>
                              <h4 className="text-base font-semibold mb-3 tracking-tight">Affected Internal Entities</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="bg-card/30 shadow-sm hover:shadow-md transition-shadow">
                                  <CardContent className="p-5 flex items-center gap-4">
                                    <div className="h-12 w-12 shrink-0 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                      <Package className="h-6 w-6" />
                                    </div>
                                    <div className="overflow-hidden">
                                      <p className="text-sm font-semibold truncate">SKUs</p>
                                      <p className="text-sm text-muted-foreground truncate">{enrichment.matched_entities?.sku_ids?.length || 0} at risk</p>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card className="bg-card/30 shadow-sm hover:shadow-md transition-shadow">
                                  <CardContent className="p-5 flex items-center gap-4">
                                    <div className="h-12 w-12 shrink-0 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-600 dark:text-pink-400">
                                      <Building2 className="h-6 w-6" />
                                    </div>
                                    <div className="overflow-hidden">
                                      <p className="text-sm font-semibold truncate">Suppliers</p>
                                      <p className="text-sm text-muted-foreground truncate">{enrichment.matched_entities?.supplier_ids?.length || 0} affected</p>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card className="bg-card/30 shadow-sm hover:shadow-md transition-shadow">
                                  <CardContent className="p-5 flex items-center gap-4">
                                    <div className="h-12 w-12 shrink-0 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                      <Truck className="h-6 w-6" />
                                    </div>
                                    <div className="overflow-hidden">
                                      <p className="text-sm font-semibold truncate">Shipments</p>
                                      <p className="text-sm text-muted-foreground truncate">Calculated indirectly</p>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                            
                            {/* Explanation & Context */}
                            <div className="bg-muted/30 border rounded-xl p-5 shadow-sm">
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground">
                                <AlertCircle className="h-4 w-4 text-primary" />
                                Risk Context
                              </h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {enrichment.explanation}
                              </p>
                            </div>

                          </div>
                        ) : (
                          <div className="text-center p-12 border rounded-xl bg-muted/20 text-muted-foreground">
                            <Activity className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p className="text-balance">No specific supply chain enrichment data found for this article.</p>
                          </div>
                        )}
                      </div>

                      <Separator className="bg-border/60" />

                      {/* Original Article Body Snippet */}
                      <div className="space-y-4 pb-8">
                        <h3 className="text-lg font-semibold tracking-tight">Original Content Summary</h3>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground/90 leading-normal">
                          {selectedArticle.body || selectedArticle.summary}
                        </div>
                      </div>
                      
                    </div>
                  </ScrollArea>
                )}
              </div>
            </ResizablePanel>

            {selectedArticle?.source_url && rightPanelOpen && (
              <>
                <ResizableHandle withHandle />
                {/* Right Pane: Source Iframe */}
                <ResizablePanel defaultSize={30} minSize={20} className="bg-card transition-all relative">
                  <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm border rounded-md shadow-sm z-10 p-1">
                    <button 
                      onClick={() => setRightPanelOpen(false)}
                      className="p-1 px-2 text-xs font-medium hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                      title="Close source view"
                    >
                      Close
                    </button>
                    <a 
                      href={selectedArticle.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1 px-2 text-xs font-medium hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                      title="Open in new tab"
                    >
                      <LinkIcon className="h-3 w-3" />
                      Open
                    </a>
                  </div>
                  <iframe
                    src={selectedArticle.source_url} 
                    className="w-full h-full border-0 bg-white"
                    title={`Source article for ${selectedArticle.headline}`}
                    sandbox="allow-same-origin allow-scripts"
                  />
                </ResizablePanel>
              </>
            )}
            </ResizablePanelGroup>
          </div>
        </div>
      </main>
    </div>
  );
}
