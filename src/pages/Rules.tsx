import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Subsection {
  title: string;
  content: string;
  subsections?: Subsection[];
}

interface RulesSection {
  id: string;
  title: string;
  content: string;
  icon: string;
  display_order: number;
  subsections: Subsection[];
}

interface RulesConfig {
  rules_page_title: string;
  rules_page_subtitle: string;
  rules_warning_title: string;
  rules_warning_text: string;
  rules_footer_text: string;
}

const Rules = () => {
  const [sections, setSections] = useState<RulesSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [config, setConfig] = useState<RulesConfig>({
    rules_page_title: 'Server Regels',
    rules_page_subtitle: 'Selecteer een categorie om de regels te bekijken',
    rules_warning_title: 'Belangrijke Waarschuwing',
    rules_warning_text: 'Het overtreden van deze regels kan leiden tot een waarschuwing, kick, tijdelijke ban of permanente ban, afhankelijk van de ernst van de overtreding. Bij twijfel, vraag het aan een staff lid!',
    rules_footer_text: 'Heb je vragen over de regels? Neem contact op via Discord!'
  });

  useEffect(() => {
    loadSections();
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data } = await supabase
      .from('home_config')
      .select('*')
      .single();
    
    if (data) {
      const c = data as any;
      setConfig({
        rules_page_title: c.rules_page_title ?? 'Server Regels',
        rules_page_subtitle: c.rules_page_subtitle ?? 'Selecteer een categorie om de regels te bekijken',
        rules_warning_title: c.rules_warning_title ?? 'Belangrijke Waarschuwing',
        rules_warning_text: c.rules_warning_text ?? 'Het overtreden van deze regels kan leiden tot een waarschuwing, kick, tijdelijke ban of permanente ban, afhankelijk van de ernst van de overtreding. Bij twijfel, vraag het aan een staff lid!',
        rules_footer_text: c.rules_footer_text ?? 'Heb je vragen over de regels? Neem contact op via Discord!'
      });
    }
  };

  const loadSections = async () => {
    const { data } = await supabase
      .from('rules_sections')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });
    
    if (data) {
      const parsed = data.map(section => ({
        ...section,
        subsections: Array.isArray(section.subsections) 
          ? section.subsections as unknown as Subsection[]
          : [],
      })) as RulesSection[];
      setSections(parsed);
    }
  };

  const scrollToSubsection = (subsectionIndex: number) => {
    const element = document.getElementById(`subsection-${subsectionIndex}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('###')) {
        return (
          <h4 key={idx} className="text-lg font-semibold text-foreground mt-4 mb-2">
            {trimmed.replace(/^#+\s/, '')}
          </h4>
        );
      }
      
      if (trimmed.startsWith('##')) {
        return (
          <h3 key={idx} className="text-xl font-bold text-foreground mt-6 mb-3">
            {trimmed.replace(/^#+\s/, '')}
          </h3>
        );
      }
      
      if (trimmed.startsWith('#')) {
        return (
          <h2 key={idx} className="text-2xl font-bold text-foreground mt-8 mb-4">
            {trimmed.replace(/^#+\s/, '')}
          </h2>
        );
      }
      
      if (trimmed === '') {
        return <div key={idx} className="h-3" />;
      }
      
      if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
        return (
          <li key={idx} className="text-muted-foreground leading-relaxed ml-6 mb-1">
            {trimmed.replace(/^[-•]\s/, '')}
          </li>
        );
      }
      
      return (
        <p key={idx} className="text-muted-foreground leading-relaxed mb-2">
          {line}
        </p>
      );
    });
  };

  const currentSection = sections.find(s => s.id === selectedSection);

  // Overview view - showing all main categories
  if (!selectedSection) {
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
              {config.rules_page_title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {config.rules_page_subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map((section, idx) => (
              <Card 
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className="p-8 hover:shadow-glow transition-all duration-500 border-2 border-border hover:border-primary cursor-pointer animate-fade-in overflow-hidden relative group"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-start gap-6 mb-4">
                    <div className="text-6xl group-hover:scale-110 transition-transform duration-300">{section.icon}</div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {section.title}
                      </h2>
                      <div className="h-1 w-20 bg-primary/30 group-hover:bg-primary/60 group-hover:w-32 transition-all duration-300" />
                    </div>
                  </div>

                  {section.content && (
                    <p className="text-muted-foreground line-clamp-3 mt-4">
                      {section.content.split('\n')[0]}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {sections.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                Regels worden binnenkort toegevoegd...
              </p>
            </Card>
          )}

          <Card className="mt-16 p-8 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-destructive/20 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-3">
              <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <span className="text-3xl">⚠️</span>
                {config.rules_warning_title}
              </h3>
              <p className="text-foreground/90 leading-relaxed text-lg">
                {config.rules_warning_text}
              </p>
            </div>
          </Card>
        </main>

        {/* Footer */}
        <footer className="relative border-t border-border/50 py-12 px-4 mt-24">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-muted-foreground text-lg">
              {config.rules_footer_text}
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // Detail view - showing selected section with sidebar
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-80 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col">
          <div className="p-6 border-b border-border flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSection(null)}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar overzicht
            </Button>
            
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{currentSection?.icon}</span>
              <h1 className="text-2xl font-bold text-foreground">
                {currentSection?.title}
              </h1>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4">
              {currentSection?.subsections && currentSection.subsections.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-3 px-2">
                    Inhoud
                  </p>
                  <div className="space-y-1">
                    {currentSection.subsections.map((subsection, idx) => (
                      <button
                        key={idx}
                        onClick={() => scrollToSubsection(idx)}
                        className="w-full text-left px-3 py-2.5 text-sm rounded-md hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border/50"
                      >
                        {subsection.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Warning card in sidebar */}
          <Card className="m-4 p-4 bg-destructive/10 border-destructive/30 flex-shrink-0">
            <div className="flex items-start gap-2">
              <span className="text-2xl">⚠️</span>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">Waarschuwing</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Overtreding kan leiden tot straf
                </p>
              </div>
            </div>
          </Card>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden bg-background">
          <ScrollArea id="content-area" className="h-full">
            <div className="max-w-4xl mx-auto p-8">
              <div className="animate-fade-in space-y-8">
                <div className="flex items-start gap-6 mb-8">
                  <div className="text-6xl">{currentSection?.icon}</div>
                  <div className="flex-1">
                    <h2 className="text-4xl font-bold text-foreground mb-3">
                      {currentSection?.title}
                    </h2>
                    <div className="h-1 w-24 bg-primary/50 rounded" />
                  </div>
                </div>

                {currentSection?.subsections && currentSection.subsections.length > 0 && (
                  <div className="space-y-12">
                    {currentSection.subsections.map((subsection, idx) => (
                      <div 
                        key={idx}
                        id={`subsection-${idx}`}
                        className="scroll-mt-24 space-y-3"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-1 w-12 bg-primary/50 rounded" />
                          <h3 className="text-2xl font-semibold text-foreground">
                            {subsection.title}
                          </h3>
                        </div>
                        <div className="space-y-2 pl-4">
                          {renderContent(subsection.content)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bottom warning */}
                <Card className="p-8 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/30 relative overflow-hidden mt-12">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-destructive/20 rounded-full blur-3xl" />
                  <div className="relative z-10 space-y-3">
                    <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
                      <span className="text-3xl">⚠️</span>
                      {config.rules_warning_title}
                    </h3>
                    <p className="text-foreground/90 leading-relaxed text-lg">
                      {config.rules_warning_text}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
};

export default Rules;
