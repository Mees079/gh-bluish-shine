import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface RulesSection {
  id: string;
  title: string;
  content: string;
  icon: string;
  display_order: number;
}

const Rules = () => {
  const [sections, setSections] = useState<RulesSection[]>([]);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    const { data } = await supabase
      .from('rules_sections')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });
    
    if (data) {
      setSections(data);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-12 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
            Server Regels
          </h1>
          <p className="text-xl text-muted-foreground">
            Lees de regels zorgvuldig door voordat je begint met spelen
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section, idx) => (
            <Card 
              key={section.id}
              className="p-6 hover:shadow-glow transition-all duration-300 animate-fade-in border-2"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <div className="text-5xl">{section.icon}</div>
                <div className="flex-1 space-y-4">
                  <h2 className="text-2xl font-bold text-foreground">
                    {section.title}
                  </h2>
                  <Separator className="bg-primary/30" />
                  <div className="space-y-2">
                    {section.content.split('\n').map((line, lineIdx) => (
                      <p 
                        key={lineIdx}
                        className="text-muted-foreground leading-relaxed"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {sections.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                Regels worden binnenkort toegevoegd...
              </p>
            </Card>
          )}
        </div>

        <Card className="mt-12 p-6 bg-destructive/10 border-destructive/30">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              ⚠️ Belangrijke Waarschuwing
            </h3>
            <p className="text-foreground/90">
              Het overtreden van deze regels kan leiden tot een waarschuwing, kick, tijdelijke ban of permanente ban, 
              afhankelijk van de ernst van de overtreding. Bij twijfel, vraag het aan een staff lid!
            </p>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground">
            Heb je vragen over de regels? Neem contact op via Discord!
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Rules;
