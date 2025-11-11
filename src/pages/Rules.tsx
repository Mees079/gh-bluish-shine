import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface RulesSection {
  id: string;
  title: string;
  content: string;
  icon: string;
  display_order: number;
  subsections: Array<{
    title: string;
    content: string;
  }>;
  show_as_accordion: boolean;
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
      // Parse subsections from JSON
      const parsed = data.map(section => ({
        ...section,
        subsections: Array.isArray(section.subsections) 
          ? section.subsections as unknown as Array<{title: string; content: string}>
          : [],
      })) as RulesSection[];
      setSections(parsed);
    }
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, idx) => (
      <p 
        key={idx}
        className={`leading-relaxed ${
          line.trim().startsWith('##') 
            ? 'text-xl font-bold text-foreground mt-6 mb-3' 
            : line.trim().startsWith('#')
            ? 'text-2xl font-bold text-foreground mt-8 mb-4'
            : line.trim() === ''
            ? 'h-2'
            : 'text-muted-foreground'
        }`}
      >
        {line.replace(/^#+\s/, '')}
      </p>
    ));
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      <Navbar />
      
      <main className="relative max-w-6xl mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-16 animate-fade-in">
          <div className="inline-block px-4 py-1 bg-primary/10 border border-primary/30 rounded-full mb-4">
            <span className="text-primary font-semibold text-sm">Regels</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">
            Server Regels
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Lees de regels zorgvuldig door voordat je begint met spelen
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section, idx) => (
            <Card 
              key={section.id}
              className="p-8 hover:shadow-glow transition-all duration-500 border-2 border-border hover:border-primary animate-fade-in overflow-hidden relative"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-start gap-6 mb-6">
                  <div className="text-6xl">{section.icon}</div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-foreground mb-2">
                      {section.title}
                    </h2>
                    <Separator className="bg-primary/30 h-1 w-24" />
                  </div>
                </div>

                {section.show_as_accordion && section.subsections?.length > 0 ? (
                  // Render as accordion with subsections
                  <Accordion type="single" collapsible className="space-y-2">
                    {/* Main content */}
                    {section.content && (
                      <div className="mb-4 space-y-2">
                        {renderContent(section.content)}
                      </div>
                    )}
                    
                    {/* Subsections as accordion items */}
                    {section.subsections.map((subsection, subIdx) => (
                      <AccordionItem 
                        key={subIdx} 
                        value={`item-${subIdx}`}
                        className="border border-border/50 rounded-lg px-4"
                      >
                        <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                          {subsection.title}
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 pt-2">
                          {renderContent(subsection.content)}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  // Render as regular content with subsections inline
                  <div className="space-y-6">
                    <div className="space-y-2">
                      {renderContent(section.content)}
                    </div>

                    {section.subsections?.length > 0 && (
                      <div className="space-y-6 pl-4 border-l-2 border-primary/30">
                        {section.subsections.map((subsection, subIdx) => (
                          <div key={subIdx} className="space-y-2">
                            <h3 className="text-xl font-semibold text-foreground">
                              {subsection.title}
                            </h3>
                            <div className="space-y-2">
                              {renderContent(subsection.content)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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

        <Card className="mt-16 p-8 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-destructive/20 rounded-full blur-3xl" />
          <div className="relative z-10 space-y-3">
            <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              Belangrijke Waarschuwing
            </h3>
            <p className="text-foreground/90 leading-relaxed text-lg">
              Het overtreden van deze regels kan leiden tot een waarschuwing, kick, tijdelijke ban of permanente ban, 
              afhankelijk van de ernst van de overtreding. Bij twijfel, vraag het aan een staff lid!
            </p>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-border/50 py-12 px-4 mt-24">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground text-lg">
            Heb je vragen over de regels? Neem contact op via Discord!
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Rules;
