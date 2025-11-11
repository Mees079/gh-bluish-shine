import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

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
}

const Rules = () => {
  const [sections, setSections] = useState<RulesSection[]>([]);
  const [activeSection, setActiveSection] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSections();
  }, []);

  useEffect(() => {
    if (sections.length > 0 && !activeSection) {
      setActiveSection(sections[0].id);
      setExpandedSections(new Set([sections[0].id]));
    }
  }, [sections, activeSection]);

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
          ? section.subsections as unknown as Array<{title: string; content: string}>
          : [],
      })) as RulesSection[];
      setSections(parsed);
    }
  };

  const toggleSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setExpandedSections(new Set([sectionId]));
    // Scroll to top of content
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
      contentArea.scrollTop = 0;
    }
  };

  const scrollToSubsection = (sectionId: string, subsectionIndex: number) => {
    setActiveSection(sectionId);
    setExpandedSections(new Set([sectionId]));
    setTimeout(() => {
      const element = document.getElementById(`subsection-${sectionId}-${subsectionIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-80 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col">
          <div className="p-6 border-b border-border flex-shrink-0">
            <div className="inline-block px-4 py-1 bg-primary/10 border border-primary/30 rounded-full mb-3">
              <span className="text-primary font-semibold text-sm">Regels</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Server Regels</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Selecteer een categorie
            </p>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4">
              {/* Main categories */}
              <div className="space-y-2 mb-4">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200",
                      "hover:bg-primary/10",
                      activeSection === section.id
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-foreground hover:border hover:border-border"
                    )}
                  >
                    <span className="text-2xl flex-shrink-0">{section.icon}</span>
                    <span className="font-semibold">
                      {section.title}
                    </span>
                  </button>
                ))}
              </div>

              {/* Subsections for active category */}
              {activeSection && sections.find(s => s.id === activeSection)?.subsections?.length > 0 && (
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-3 px-2">
                    Inhoud
                  </p>
                  <div className="space-y-1">
                    {sections.find(s => s.id === activeSection)?.subsections.map((subsection, idx) => (
                      <button
                        key={idx}
                        onClick={() => scrollToSubsection(activeSection, idx)}
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
        <main className="flex-1 overflow-hidden">
          <ScrollArea id="content-area" className="h-full">
            <div className="max-w-4xl mx-auto p-8">
              {activeSection ? (
                <div className="animate-fade-in">
                  {sections.filter(s => s.id === activeSection).map((section) => (
                    <div key={section.id}>
                      <Card className="p-8 border-2 hover:border-primary/50 transition-colors duration-300 mb-8">
                        <div className="flex items-start gap-6 mb-6">
                          <div className="text-6xl">{section.icon}</div>
                          <div className="flex-1">
                            <h2 className="text-4xl font-bold text-foreground mb-3">
                              {section.title}
                            </h2>
                            <div className="h-1 w-24 bg-primary/50 rounded" />
                          </div>
                        </div>

                        <div className="space-y-4">
                          {section.content && (
                            <div className="space-y-2">
                              {renderContent(section.content)}
                            </div>
                          )}

                          {section.subsections?.length > 0 && (
                            <div className="space-y-12 mt-8">
                              {section.subsections.map((subsection, idx) => (
                                <div 
                                  key={idx}
                                  id={`subsection-${section.id}-${idx}`}
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
                        </div>
                      </Card>

                      {/* Bottom warning */}
                      <Card className="p-8 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/30 relative overflow-hidden">
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Card className="p-12 text-center">
                    <p className="text-muted-foreground text-lg">
                      Selecteer een categorie om de regels te bekijken
                    </p>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
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
