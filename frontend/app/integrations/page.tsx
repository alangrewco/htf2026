import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Blocks, CheckCircle2, ArrowRight } from "lucide-react";
import { NavbarSpacer } from "@/components/navbar";

const integrations = [
  {
    name: "SAP S/4 HANA",
    description: "Enterprise resource planning software. Sync SKUs, shipments, and supplier info in real-time.",
    status: "Connected",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    name: "Oracle NetSuite",
    description: "Cloud-based business management platform. Streamline your supply chain operations.",
    status: "Available",
    color: "bg-orange-500/10 text-orange-500",
  },
  {
    name: "Microsoft Dynamics 365",
    description: "Intelligent business applications suite. Connect your ERP and CRM data seamlessly.",
    status: "Available",
    color: "bg-blue-600/10 text-blue-600",
  },
  {
    name: "Infor",
    description: "Industry-specific cloud software. Deep integration for manufacturing and distribution.",
    status: "Available",
    color: "bg-red-500/10 text-red-500",
  },
  {
    name: "Odoo",
    description: "Open-source suite of business apps. Connect all your core processes instantly.",
    status: "Available",
    color: "bg-purple-500/10 text-purple-500",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <NavbarSpacer />
      
      <main className="container mx-auto px-4 pt-10 mt-6 max-w-6xl">
        <div className="flex flex-col gap-2 mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground text-lg">
            Connect HarborGuard AI securely to your enterprise systems to automatically sync SKUs, shipments, and supplier data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <Card key={integration.name} className="flex flex-col hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm shadow-sm group">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className={`p-2.5 rounded-lg ${integration.color}`}>
                    <Blocks className="w-6 h-6" />
                  </div>
                  {integration.status === "Connected" ? (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 gap-1 pr-2.5">
                      <CheckCircle2 className="w-3 h-3" />
                      {integration.status}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground font-normal">
                      {integration.status}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{integration.name}</CardTitle>
                <CardDescription className="text-sm mt-1.5 leading-relaxed">
                  {integration.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3 font-medium">
                  Syncs: <span className="text-foreground">SKUs, Shipments, Suppliers</span>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-border/50">
                <Button 
                  variant={integration.status === "Connected" ? "outline" : "default"} 
                  className="w-full justify-between group/btn"
                >
                  {integration.status === "Connected" ? "Manage Integration" : "Connect"}
                  <ArrowRight className="w-4 h-4 ml-2 opacity-50 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
