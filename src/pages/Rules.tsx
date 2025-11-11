import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import ReactMarkdown from "react-markdown";

const Rules = () => {
  const [rulesContent, setRulesContent] = useState<string>("");
  const [discordLink, setDiscordLink] = useState<string | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    const { data } = await supabase
      .from('home_config')
      .select('rules_content, discord_link')
      .single();
    
    if (data) {
      setRulesContent(data.rules_content || "");
      setDiscordLink(data.discord_link);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar discordLink={discordLink} />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-4xl font-bold text-foreground mb-6">{children}</h1>,
              h2: ({ children }) => <h2 className="text-3xl font-semibold text-foreground mt-8 mb-4">{children}</h2>,
              h3: ({ children }) => <h3 className="text-2xl font-semibold text-foreground mt-6 mb-3">{children}</h3>,
              p: ({ children }) => <p className="text-muted-foreground mb-4 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">{children}</ol>,
              li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
            }}
          >
            {rulesContent}
          </ReactMarkdown>
        </div>
      </main>
    </div>
  );
};

export default Rules;
