import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  discordLink?: string | null;
}

export const Navbar = ({ discordLink }: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-foreground hover:text-primary transition-colors">
            Shop
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {discordLink && (
              <a 
                href={discordLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                Discord
              </a>
            )}
            <Link 
              to="/shop" 
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Shop
            </Link>
            <Link 
              to="/regels" 
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Regels
            </Link>
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
            <Link 
              to="/shop" 
              className="block px-4 py-2 text-foreground hover:bg-accent rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shop
            </Link>
            <Link 
              to="/regels" 
              className="block px-4 py-2 text-foreground hover:bg-accent rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Regels
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
