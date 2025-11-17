import { Shield, Code, Lock, Heart, Github, Zap, Key, ShieldCheck } from "lucide-react";
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
              All Phases: Complete ✓
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Guardian Protection
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
                  Guardian exists to protect <strong>ALL children</strong> from online predators—not just those whose parents can afford premium services.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We believe child safety is a <strong>fundamental right</strong>, not a luxury. This project is free forever, open source, and community-driven.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Key Features</h2>
            <p className="text-xl text-muted-foreground">
              Enterprise-grade protection with privacy first
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "End-to-End Encrypted Evidence",
                description: "All captured interactions are encrypted with AES-256-GCM before storage. Only parents with the device key can decrypt and view evidence.",
                icon: ShieldCheck,
                color: "text-primary",
                bgColor: "bg-primary/10",
              },
              {
                title: "Real-Time Threat Detection",
                description: "Multi-layered detection engine combines YAML rules, pattern matching, and ML classifiers to identify threats instantly as they occur.",
                icon: Zap,
                color: "text-accent",
                bgColor: "bg-accent/10",
              },
              {
                title: "Parent Authentication",
                description: "PIN-based parent access with lockdown mode. Failed attempts trigger cooldowns and audit logs for complete accountability.",
                icon: Key,
                color: "text-primary",
                bgColor: "bg-primary/10",
              },
            ].map((feature) => (
              <Card key={feature.title} className="border-border/50 hover:border-primary/50 transition-all hover:shadow-[var(--shadow-elevated)]">
                <CardContent className="p-8 space-y-4">
                  <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-card/50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">See Guardian In Action</h2>
              <p className="text-xl text-muted-foreground">
                Watch how Guardian detects and responds to threats in real-time
              </p>
            </div>

            <Card className="border-primary/20 overflow-hidden shadow-[var(--shadow-elevated)]">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  {/* Video/GIF placeholder - replace with actual demo video */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                    <Shield className="w-20 h-20 text-primary/40" />
                    <p className="text-2xl font-bold text-muted-foreground">Live Demo Video</p>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      Replace this placeholder with your demo video showing Guardian detecting threats in real-time
                    </p>
                  </div>
                  {/* Uncomment when you have the actual video/GIF:
                  <video 
                    controls 
                    poster="/path-to-poster-image.jpg"
                    className="w-full h-full object-cover"
                  >
                    <source src="/path-to-demo-video.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  */}
                  {/* Or for animated GIF:
                  <img 
                    src="/path-to-demo.gif" 
                    alt="Guardian threat detection demo"
                    className="w-full h-full object-cover"
                  />
                  */}
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6 mt-8">
              {[
                { step: "1", title: "Monitor", desc: "Guardian watches conversations in real-time" },
                { step: "2", title: "Detect", desc: "AI identifies suspicious patterns instantly" },
                { step: "3", title: "Protect", desc: "Parents receive encrypted alerts immediately" },
              ].map((item) => (
                <div key={item.step} className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center mx-auto mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-card/50">
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
                package: "@guardian/buffer",
                phase: "Phase 1",
                status: "Complete",
                description: "Rolling buffer system with time-windowed snapshots",
                icon: Shield,
                complete: true,
              },
              {
                package: "@guardian/detector",
                phase: "Phase 2",
                status: "Complete",
                description: "YAML-based rule engine with pattern matching",
                icon: Lock,
                complete: true,
              },
              {
                package: "@guardian/extension",
                phase: "Phase 3",
                status: "Complete",
                description: "Real-time monitoring with lockdown & evidence capture",
                icon: Code,
                complete: true,
              },
              {
                package: "@guardian/dashboard",
                phase: "Phase 4",
                status: "Complete",
                description: "Encrypted alerts, analytics & ML training UI",
                icon: Heart,
                complete: true,
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
      <section className="py-20">
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
                Help Build Guardian
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
