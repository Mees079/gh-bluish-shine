import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            HDRP
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className={`relative font-medium transition-colors ${
                isActive('/') ? 'text-primary' : 'text-foreground hover:text-primary'
              }`}
            >
              Home
              {isActive('/') && (
                <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
            <Link 
              to="/regels" 
              className={`relative font-medium transition-colors ${
                isActive('/regels') ? 'text-primary' : 'text-foreground hover:text-primary'
              }`}
            >
              Regels
              {isActive('/regels') && (
                <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
            <Link 
              to="/shop" 
              className={`relative font-medium transition-colors ${
                isActive('/shop') ? 'text-primary' : 'text-foreground hover:text-primary'
              }`}
            >
              Shop
              {isActive('/shop') && (
                <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
            {discordLink && (
              <a 
                href={discordLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                Discord
              </a>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-foreground hover:bg-accent"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link 
              to="/" 
              className="block px-4 py-2 text-foreground hover:bg-accent rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/regels" 
              className="block px-4 py-2 text-foreground hover:bg-accent rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Regels
            </Link>
            <Link 
              to="/shop" 
              className="block px-4 py-2 text-foreground hover:bg-accent rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shop
            </Link>
            {discordLink && (
              <a 
                href={discordLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block px-4 py-2 text-foreground hover:bg-accent rounded-md"
              >
                Discord
              </a>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
