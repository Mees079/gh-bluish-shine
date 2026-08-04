import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Search, UserRound, ShieldCheck, Code2, Video, Skull, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import hdrpLogo from "@/assets/hdrp-logo.png";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  discordLink?: string | null;
}

const TIKTOK_URL = "https://www.tiktok.com/@hdrp_mees";

const panels = [
  { to: "/staff", label: "Staff panel", icon: ShieldCheck },
  { to: "/developer", label: "Development panel", icon: Code2 },
  { to: "/contentcreator", label: "Content creator panel", icon: Video },
  { to: "/onderwereld", label: "Onderwereld panel", icon: Skull },
  { to: "/admin", label: "Beheer panel", icon: Settings },
];

export const Navbar = ({ discordLink: propDiscordLink }: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [discordLink, setDiscordLink] = useState(propDiscordLink);
  const [robloxLink, setRobloxLink] = useState<string | null>(null);
  const [tiktokLink, setTiktokLink] = useState<string | null>(TIKTOK_URL);
  const [query, setQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadLinks = async () => {
      const { data } = await supabase
        .from('home_config')
        .select('discord_link, roblox_link, tiktok_link')
        .maybeSingle();

      if (data?.discord_link && !propDiscordLink) setDiscordLink(data.discord_link);
      setRobloxLink(data?.roblox_link ?? null);
      setTiktokLink(data?.tiktok_link ?? TIKTOK_URL);
    };

    loadLinks();
  }, [propDiscordLink]);

  const isActive = (path: string) => location.pathname === path;

  const links = [
    { to: "/", label: "Home" },
    { to: "/regels", label: "Regels" },
    { to: "/shop", label: "Shop" },
    { to: "/support", label: "Support" },
    { to: "/solliciteren", label: "Solliciteren" },
  ];

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
    setMobileMenuOpen(false);
  };

  const loginMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 text-navy-foreground h-10 px-3 transition-colors"
        aria-label="Inloggen op een panel"
      >
        <UserRound className="h-5 w-5" />
        <span className="hidden lg:inline text-sm font-medium">Inloggen</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Inloggen op panel</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {panels.map((panel) => (
          <DropdownMenuItem key={panel.to} onClick={() => navigate(panel.to)} className="gap-2">
            <panel.icon className="h-4 w-4 text-primary" />
            {panel.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50">
      {/* Hoofdbalk */}
      <div className="bg-navy text-navy-foreground border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <img src={hdrpLogo} alt="HDRP logo" className="h-9 w-9 object-contain brightness-0 invert" />
              <span className="hidden sm:flex flex-col leading-none notranslate">
                <span className="font-heading text-lg font-bold tracking-tight">HDRP</span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-navy-foreground/55">Hoofddorp Roleplay</span>
              </span>
            </Link>

            {/* Zoekbalk */}
            <form onSubmit={submitSearch} className="flex-1 max-w-2xl hidden sm:block">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="search"
                  placeholder="Zoek in de shop, regels en pakketten..."
                  className="w-full h-11 rounded-full bg-card border border-border pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
                />
              </div>
            </form>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <LanguageSwitcher />
              <div className="hidden sm:block">{loginMenu}</div>
              {discordLink && (
                <a
                  href={discordLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden lg:inline-flex items-center h-10 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors"
                >
                  Discord
                </a>
              )}
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
      </div>

      {/* Navigatiebalk */}
      <nav className="hidden md:block bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 h-12">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative h-12 flex items-center px-4 text-sm font-semibold uppercase tracking-wide transition-colors ${
                  isActive(link.to)
                    ? "text-primary"
                    : "text-foreground/65 hover:text-foreground"
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

      {/* Zwarte servicebalk */}
      <div className="bg-[hsl(220_60%_3%)] text-white/85 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 sm:gap-x-16 py-2 text-[11px] sm:text-sm font-medium text-center">
            {[
              { href: discordLink, label: "Join Discord" },
              { href: robloxLink, label: "Speel op Roblox" },
              { href: tiktokLink, label: "Volg ons op TikTok" },
            ]
              .filter((item) => item.href)
              .map((item) => (
                <a
                  key={item.label}
                  href={item.href as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 decoration-white/30 hover:text-white hover:decoration-white transition-colors"
                >
                  {item.label}
                </a>
              ))}
          </div>
        </div>
      </div>



      {/* Mobiel menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-card border-b border-border shadow-sm">
          <div className="px-4 py-3 space-y-3">
            <form onSubmit={submitSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="search"
                  placeholder="Zoeken..."
                  className="w-full h-10 rounded-md bg-background border border-border pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </form>
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block py-2 text-sm font-semibold text-foreground border-b border-border last:border-0"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-1">{loginMenu}</div>
            {[
              { href: discordLink, label: "Join Discord" },
              { href: robloxLink, label: "Speel op Roblox" },
              { href: tiktokLink, label: "Volg ons op TikTok" },
            ]
              .filter((item) => item.href)
              .map((item) => (
                <a
                  key={item.label}
                  href={item.href as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-2 text-sm font-semibold text-foreground border-b border-border last:border-0"
                >
                  {item.label}
                </a>
              ))}
            {discordLink && (
              <a
                href={discordLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-2 text-sm font-semibold text-primary"
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
