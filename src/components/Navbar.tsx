import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import hdrpLogo from "@/assets/hdrp-logo.png";


interface NavbarProps {
  discordLink?: string | null;
}

export const Navbar = ({ discordLink: propDiscordLink }: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [discordLink, setDiscordLink] = useState(propDiscordLink);
  const location = useLocation();

  useEffect(() => {
    const loadDiscordLink = async () => {
      const { data } = await supabase
        .from('home_config')
        .select('discord_link')
        .single();
      
      if (data?.discord_link) {
        setDiscordLink(data.discord_link);
      }
    };

    if (!propDiscordLink) {
      loadDiscordLink();
    }
  }, [propDiscordLink]);

  const isActive = (path: string) => location.pathname === path;

  const links = [
    { to: "/", label: "Home" },
    { to: "/regels", label: "Regels" },
    { to: "/shop", label: "Shop" },
    { to: "/support", label: "Support" },
  ];

  return (
    <header className="sticky top-0 z-50">
      {/* Hoofdbalk */}
      <div className="bg-navy text-navy-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <img src={hdrpLogo} alt="HDRP logo" className="h-8 w-8 object-contain brightness-0 invert" />
              <span className="flex flex-col leading-none">
                <span className="font-heading text-lg font-bold tracking-tight">HDRP</span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-navy-foreground/60">Hoofddorp Roleplay</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-3">
              {discordLink && (
                <a
                  href={discordLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-navy-foreground/80 hover:text-navy-foreground transition-colors"
                >
                  Discord
                </a>
              )}
              <Link
                to="/shop"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-md transition-colors"
              >
                Naar de shop
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-white/10"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigatiebalk */}
      <nav className="hidden md:block bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 h-12">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative h-12 flex items-center px-4 text-sm font-semibold transition-colors ${
                  isActive(link.to)
                    ? "text-primary"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                {link.label}
                {isActive(link.to) && (
                  <span className="absolute bottom-0 left-3 right-3 h-[3px] bg-primary rounded-t-full" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobiel menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-border shadow-sm">
          <div className="px-4 py-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block px-2 py-3 text-sm font-semibold text-foreground border-b border-border last:border-0"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {discordLink && (
              <a
                href={discordLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-2 py-3 text-sm font-semibold text-primary"
              >
                Discord
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

