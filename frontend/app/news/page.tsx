"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useListArticles, useGetArticleEnrichment } from "@/sdk/articles/articles";
import { NavbarSpacer } from "@/components/navbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  Calendar, 
  Globe2, 
  MapPin, 
  Link as LinkIcon,
  Activity,
  ArrowRight,
  Package,
  Truck,
  Building2,
  AlertCircle,
  Newspaper
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
    case "irrelevant":
      return <Badge variant="secondary" className="text-muted-foreground">Ignored</Badge>;
    default:
      return <Badge variant="outline" className="text-blue-500 border-blue-500/30 bg-blue-500/10 capitalize">{state}</Badge>;
  }
};

export default function NewsPage() {
  const { data: articlesResponse, isLoading: isLoadingArticles } = useListArticles();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const articles = (articlesResponse?.data as any)?.items as Article[] || [];
  
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  // Auto-select first article when loaded
  const currentSelection = selectedArticleId || (articles.length > 0 ? articles[0].id : null);
  const selectedArticle = articles.find((a: Article) => a.id === currentSelection);

  const { data: enrichmentResponse, isLoading: isLoadingEnrichment } = useGetArticleEnrichment(
    currentSelection ?? "", 
    { swr: { enabled: !!currentSelection } }
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enrichment = enrichmentResponse?.data as any as Enrichment;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavbarSpacer />
      
      <main className="flex-1 container max-w-[1600px] mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6">
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

        {/* Split Pane Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[700px]">
          
          {/* Left Pane: Article Feed */}
          <div className="lg:col-span-4 flex flex-col h-[calc(100vh-220px)] border rounded-xl overflow-hidden bg-card/50">
            <div className="p-4 border-b bg-card">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-muted-foreground" />
                Live Feed
              </h2>
            </div>
            <ScrollArea className="flex-1">
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
                  <p>No active alerts detected.</p>
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
                          "p-4 cursor-pointer transition-all hover:bg-accent/50",
                          isSelected ? "bg-accent/80 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {article.source_name || article.source}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(article.published_at), "MMM d, HH:mm")}
                          </span>
                        </div>
                        <h3 className={cn("font-medium mb-2 leading-tight", isSelected ? "text-foreground" : "text-foreground/80")}>
                          {article.headline}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {article.preview_text}
                        </p>
                        <div className="flex flex-wrap gap-2 items-center">
                          {getProcessingStateBadge(article.processing_state)}
                          {article.tags.slice(0, 2).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] capitalize px-1.5 font-normal">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Pane: Analysis & Impact */}
          <div className="lg:col-span-8 flex flex-col h-[calc(100vh-220px)] border rounded-xl overflow-hidden bg-background">
            {!selectedArticle ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                <Newspaper className="h-12 w-12 mb-4 opacity-20" />
                <p>Select an article from the feed to view full analysis and supply chain impact.</p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="p-6 md:p-8 space-y-8">
                  
                  {/* Article Header */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      {getProcessingStateBadge(selectedArticle.processing_state)}
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(selectedArticle.published_at), "PPPP 'at' p")}
                      </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                      {selectedArticle.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{selectedArticle.source_name || selectedArticle.source}</span>
                      {selectedArticle.source_url && (
                        <a href={selectedArticle.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                          <LinkIcon className="h-3 w-3" />
                          View Original Source
                        </a>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* AI Analysis Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Platform Analysis
                    </h3>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
                      <p className="text-sm leading-relaxed text-foreground/90">
                        {selectedArticle.analysis || selectedArticle.summary}
                      </p>
                    </div>
                  </div>

                  {/* Enrichment Data (Risk & Impact) */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Supply Chain Impact Assessment
                    </h3>

                    {isLoadingEnrichment ? (
                      <div className="space-y-4 animate-pulse">
                        <div className="h-32 w-full rounded-xl bg-muted" />
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          <div className="h-24 w-full bg-muted rounded-xl" />
                          <div className="h-24 w-full bg-muted rounded-xl" />
                          <div className="h-24 w-full bg-muted rounded-xl" />
                        </div>
                      </div>
                    ) : enrichment && enrichment.is_relevant ? (
                      <div className="space-y-6">
                        {/* Status Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {/* Risk Level */}
                          <Card>
                            <CardContent className="p-5 flex flex-col gap-2">
                              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Computed Risk</span>
                              <div className="flex items-end gap-3">
                                <span className={cn("text-3xl font-bold capitalize", getRiskColor(enrichment.risk_level).split(" ")[0])}>
                                  {enrichment.risk_level}
                                </span>
                                <span className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                  Score: {enrichment.risk_score}/100
                                </span>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Impact Horizon */}
                          <Card>
                            <CardContent className="p-5 flex flex-col gap-2">
                              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Impact Window</span>
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground capitalize">
                                  {enrichment.horizon.replace("_", " ")}
                                </span>
                                <span className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(enrichment.impact_window.start_at), "MMM d")} - {format(new Date(enrichment.impact_window.end_at), "MMM d, yyyy")}
                                </span>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Geolocation */}
                          <Card className="md:col-span-2 xl:col-span-1">
                            <CardContent className="p-5 flex flex-col gap-2">
                              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                                <MapPin className="h-4 w-4" /> Affected Regions
                              </span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {enrichment.geo?.ports?.map((port: string) => (
                                  <Badge key={port} variant="outline" className="border-border">Port of {port}</Badge>
                                ))}
                                {enrichment.geo?.countries?.map((country: string) => (
                                  <Badge key={country} variant="secondary">{country}</Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Explanation & Context */}
                        <div className="bg-card border rounded-lg p-5">
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            Risk Explanation
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {enrichment.explanation}
                          </p>
                        </div>

                        {/* Affected Entities */}
                        <div>
                          <h4 className="text-sm font-semibold mb-3">Affected Internal Entities</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-card/50">
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Package className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">SKUs</p>
                                    <p className="text-xs text-muted-foreground">{enrichment.matched_entities?.sku_ids?.length || 0} at risk</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="bg-card/50">
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                                    <Building2 className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Suppliers</p>
                                    <p className="text-xs text-muted-foreground">{enrichment.matched_entities?.supplier_ids?.length || 0} affected</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="bg-card/50">
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <Truck className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Shipments</p>
                                    <p className="text-xs text-muted-foreground">Calculated indirectly</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="text-center p-8 border rounded-lg bg-card/50 text-muted-foreground">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p>No specific supply chain enrichment data found for this article.</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Original Article Body */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Original Content Snippet</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                      {selectedArticle.body || selectedArticle.summary}
                    </div>
                  </div>
                  
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
