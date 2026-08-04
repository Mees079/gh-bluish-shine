import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, ArrowRight, Clock, ShieldCheck, HelpCircle, FileText } from "lucide-react";

const Support = () => {
  const [discordLink, setDiscordLink] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("home_config")
      .select("discord_link")
      .maybeSingle()
      .then(({ data }) => setDiscordLink(data?.discord_link ?? null));
  }, []);

  const cards = [
    {
      icon: Clock,
      title: "Snelle reactie",
      text: "Ons supportteam staat dagelijks klaar en reageert doorgaans binnen enkele uren op je ticket.",
    },
    {
      icon: ShieldCheck,
      title: "Veilig & privé",
      text: "Je ticket is alleen zichtbaar voor jou en het HDRP-supportteam. Deel nooit je wachtwoord.",
    },
    {
      icon: FileText,
      title: "Goed voorbereid",
      text: "Vermeld je Roblox-naam, wat er gebeurde en voeg bewijs (screenshots of clips) toe.",
    },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <Navbar discordLink={discordLink} />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-navy text-navy-foreground">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.22)_0%,_transparent_60%)]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em]">
              Support
            </span>
            <h1 className="mt-6 font-heading text-3xl sm:text-5xl font-bold tracking-tight">
              Hulp nodig? Maak een ticket aan in onze Discord
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-navy-foreground/70">
              Alle support van Hoofddorp Roleplay verloopt via Discord. Open daar een ticket en een
              medewerker van het supportteam helpt je persoonlijk verder.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={discordLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-primary text-primary-foreground text-sm font-semibold transition-colors hover:bg-primary/90 ${
                  discordLink ? "" : "pointer-events-none opacity-60"
                }`}
              >
                <MessageCircle className="h-5 w-5" />
                Ticket aanmaken in Discord
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/regels"
                className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full border border-white/20 text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                Bekijk eerst de regels
              </Link>
            </div>
          </div>
        </section>

        {/* Stappen */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { step: "01", title: "Join de Discord", text: "Klik op de knop hierboven en word lid van de officiële HDRP Discord-server." },
              { step: "02", title: "Open een ticket", text: "Ga naar het kanaal #ticket-aanmaken en kies de categorie die bij jouw vraag past." },
              { step: "03", title: "Krijg hulp", text: "Beschrijf je vraag zo duidelijk mogelijk. Een teamlid pakt je ticket zo snel mogelijk op." },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-border bg-card p-6">
                <span className="font-heading text-3xl font-bold text-primary">{item.step}</span>
                <h2 className="mt-3 text-lg font-semibold text-foreground">{item.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            {cards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-border bg-secondary/30 p-6">
                <card.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-3 text-base font-semibold text-foreground">{card.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
            <div className="flex items-start gap-4">
              <HelpCircle className="h-7 w-7 text-primary shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Wil je bij het team komen?</h2>
                <p className="text-sm text-muted-foreground">
                  Solliciteer direct voor het staff-, development- of content creator team.
                </p>
              </div>
            </div>
            <Link
              to="/solliciteren"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-primary/40 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors"
            >
              Naar solliciteren
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Support;
