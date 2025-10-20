import { Shield, Code, Lock, Heart, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
              <Shield className="w-4 h-4" />
              Phase 1: Complete ✓
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Lumen Guardian Protection
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Open-source AI-powered system to detect online predators and protect <strong>all children</strong>, not just paying customers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                asChild
              >
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-5 w-5" />
                  View on GitHub
                </a>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Code className="mr-2 h-5 w-5" />
                Documentation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-card/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="border-none shadow-[var(--shadow-elevated)] bg-gradient-to-br from-card to-card/80">
              <CardContent className="p-8 md:p-12 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-8 h-8 text-destructive" />
                  <h2 className="text-3xl font-bold">Our Mission</h2>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Lumen Guardian exists to protect <strong>ALL children</strong> from online predators—not just those whose parents can afford premium services.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We believe child safety is a <strong>fundamental right</strong>, not a luxury. This project is free forever, open source, and community-driven.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Monorepo Architecture</h2>
            <p className="text-xl text-muted-foreground">
              TypeScript + pnpm + Turborepo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                package: "@lumen-guardian/buffer",
                phase: "Phase 1",
                status: "Complete",
                description: "Rolling buffer system with time-windowed snapshots",
                icon: Shield,
                complete: true,
              },
              {
                package: "@lumen-guardian/detector",
                phase: "Phase 2",
                status: "Coming Soon",
                description: "AI-powered threat detection engine",
                icon: Lock,
                complete: false,
              },
              {
                package: "@lumen-guardian/extension",
                phase: "Phase 3",
                status: "Coming Soon",
                description: "Browser extension for real-time monitoring",
                icon: Code,
                complete: false,
              },
              {
                package: "@lumen-guardian/dashboard",
                phase: "Phase 4",
                status: "Coming Soon",
                description: "Parent dashboard and alert system",
                icon: Heart,
                complete: false,
              },
            ].map((item) => (
              <Card 
                key={item.package}
                className={`relative overflow-hidden transition-all hover:shadow-[var(--shadow-elevated)] ${
                  item.complete ? 'border-primary/50 bg-primary/5' : 'border-border'
                }`}
              >
                {item.complete && (
                  <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                    ✓ READY
                  </div>
                )}
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.complete ? 'bg-primary/20' : 'bg-muted'}`}>
                      <item.icon className={`w-6 h-6 ${item.complete ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground font-medium">{item.phase}</div>
                      <div className={`text-xs font-semibold ${item.complete ? 'text-accent' : 'text-muted-foreground'}`}>
                        {item.status}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-semibold mb-2">{item.package}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Section */}
      <section className="py-20 bg-gradient-to-b from-card/50 to-transparent">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">
              Built for Speed & Reliability
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { metric: "<10ns", label: "Push Operation", status: "✓" },
                { metric: "<1ms", label: "Capture Snapshot", status: "✓" },
                { metric: "~500 bytes", label: "Memory per Interaction", status: "✓" },
              ].map((item) => (
                <Card key={item.label} className="border-accent/50 bg-accent/5">
                  <CardContent className="p-6 text-center space-y-2">
                    <div className="text-3xl font-bold text-accent">{item.metric}</div>
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                    <div className="text-2xl">{item.status}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-[var(--shadow-elevated)]">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Help Build Lumen Guardian
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                This is a community project. Contribute code, report bugs, suggest features, or help spread the word.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  asChild
                >
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-5 w-5" />
                    Contribute on GitHub
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="text-lg font-medium">
            Built with ❤️ to protect children everywhere.
          </p>
          <p className="text-sm mt-2">
            Open Source • Free Forever • Community Driven
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
