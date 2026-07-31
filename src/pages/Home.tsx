import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { ChevronDown, Users, Server, Shield, Zap } from "lucide-react";
import heroBanner from "@/assets/hero-banner.png";
import hdrpLogo from "@/assets/hdrp-logo.png";



interface HomeConfig {
  hero_image_url: string | null;
  hero_title: string;
  hero_subtitle: string | null;
  hero_cta_text: string | null;
  hero_cta_link: string | null;
  roblox_link: string | null;
  about_title: string;
  about_content: string | null;
  about_image_url: string | null;
  features_title: string;
  feature_1_title: string;
  feature_1_description: string;
  feature_1_icon: string;
  feature_2_title: string;
  feature_2_description: string;
  feature_2_icon: string;
  feature_3_title: string;
  feature_3_description: string;
  feature_3_icon: string;
  gallery_title: string;
  show_gallery: boolean;
  cta_section_title: string;
  cta_section_description: string;
  cta_button_text: string;
  discord_link: string | null;
  footer_description: string | null;
  show_about_section: boolean;
  show_features_section: boolean;
  show_cta_section: boolean;
}

interface HomeStat {
  id: string;
  icon: string;
  label: string;
  value: string;
  display_order: number;
}

interface GalleryImage {
  id: string;
  image_url: string;
  title: string | null;
}

const iconMap: Record<string, any> = {
  Users,
  Server,
  Shield,
  Zap,
};

const Home = () => {
  const [config, setConfig] = useState<HomeConfig | null>(null);
  const [stats, setStats] = useState<HomeStat[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [showAllGallery, setShowAllGallery] = useState(false);
  const aboutRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConfig();
    loadStats();
    loadGallery();
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    const sections = [aboutRef.current, featuresRef.current, galleryRef.current];
    sections.forEach(section => {
      if (section) {
        // Check if element is already in view
        const rect = section.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight && rect.bottom > 0;
        if (isInView) {
          section.classList.add('animate-in');
        }
        observer.observe(section);
      }
    });

    return () => observer.disconnect();
  }, [config, galleryImages]);

  const loadConfig = async () => {
    const { data } = await supabase
      .from('home_config')
      .select('*')
      .single();
    
    if (data) {
      const c = data as any;
      setConfig({
        hero_image_url: c.hero_image_url ?? null,
        hero_title: c.hero_title ?? "",
        hero_subtitle: c.hero_subtitle ?? null,
        hero_cta_text: c.hero_cta_text ?? null,
        hero_cta_link: c.hero_cta_link ?? null,
        roblox_link: c.roblox_link ?? null,
        about_title: c.about_title ?? "",
        about_content: c.about_content ?? null,
        about_image_url: c.about_image_url ?? null,
        features_title: c.features_title ?? "",
        feature_1_title: c.feature_1_title ?? "",
        feature_1_description: c.feature_1_description ?? "",
        feature_1_icon: c.feature_1_icon ?? "",
        feature_2_title: c.feature_2_title ?? "",
        feature_2_description: c.feature_2_description ?? "",
        feature_2_icon: c.feature_2_icon ?? "",
        feature_3_title: c.feature_3_title ?? "",
        feature_3_description: c.feature_3_description ?? "",
        feature_3_icon: c.feature_3_icon ?? "",
        gallery_title: c.gallery_title ?? "",
        show_gallery: c.show_gallery ?? true,
        cta_section_title: c.cta_section_title ?? "",
        cta_section_description: c.cta_section_description ?? "",
        cta_button_text: c.cta_button_text ?? "",
        discord_link: c.discord_link ?? null,
        footer_description: c.footer_description ?? null,
        show_about_section: c.show_about_section ?? true,
        show_features_section: c.show_features_section ?? true,
        show_cta_section: c.show_cta_section ?? true,
      });
    }
  };

  const loadStats = async () => {
    const { data } = await supabase
      .from('home_stats')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });
    
    if (data) {
      setStats(data);
    }
  };

  const loadGallery = async () => {
    const { data } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });
    
    if (data) {
      setGalleryImages(data);
    }
  };

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  if (!config) return null;

  return (
    <div className="min-h-dvh bg-secondary">
      <Navbar discordLink={config.discord_link} />

      {/* Servicebalk */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-xs sm:text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Dagelijks actieve community</span>
          <span className="hidden sm:inline">Support binnen 24 uur</span>
          <span className="hidden md:inline">Veilig & eerlijk roleplay-beleid</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Hero */}
        <section className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 sm:p-12 flex flex-col justify-center gap-5">
              <span className="inline-flex w-fit items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-primary bg-primary/10 px-3 py-1 rounded">
                Hoofddorp Roleplay
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy leading-tight">
                {config.hero_title}
              </h1>
              {config.hero_subtitle && (
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
                  {config.hero_subtitle}
                </p>
              )}
              <div className="flex flex-wrap gap-3 pt-2">
                {config.roblox_link ? (
                  <Button asChild size="lg">
                    <a href={config.roblox_link} target="_blank" rel="noopener noreferrer">
                      {config.hero_cta_text || "Start Nu"}
                    </a>
                  </Button>
                ) : (
                  <Button asChild size="lg">
                    <Link to={config.hero_cta_link || "/shop"}>{config.hero_cta_text || "Start Nu"}</Link>
                  </Button>
                )}
                {config.discord_link && (
                  <Button asChild size="lg" variant="outline">
                    <a href={config.discord_link} target="_blank" rel="noopener noreferrer">
                      Join Discord
                    </a>
                  </Button>
                )}
              </div>
            </div>
            <div className="relative min-h-[240px] lg:min-h-[380px] bg-navy">
              <img
                src={config.hero_image_url || heroBanner}
                alt="HDRP roleplay"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* Stats bento */}
        {stats.length > 0 && (
          <section
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))" }}
          >
            {stats.map((stat) => {
              const IconComponent = iconMap[stat.icon] || Users;
              return (
                <div
                  key={stat.id}
                  className="bg-white border border-border rounded-lg p-5 flex items-center gap-4 hover:border-primary/40 transition-colors"
                >
                  <div className="bg-secondary rounded-md p-2.5 shrink-0">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-navy leading-none">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Over ons */}
        {config.show_about_section && (
          <section ref={aboutRef} className="bg-white border border-border rounded-lg overflow-hidden">
            <div className={`grid grid-cols-1 ${config.about_image_url ? "lg:grid-cols-2" : ""}`}>
              <div className="p-8 sm:p-10 flex flex-col justify-center gap-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Over ons</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-navy">{config.about_title}</h2>
                <p className="text-muted-foreground leading-relaxed">{config.about_content}</p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button asChild>
                    <Link to="/shop">Bezoek shop</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/regels">Bekijk regels</Link>
                  </Button>
                </div>
              </div>
              {config.about_image_url && (
                <div className="relative min-h-[220px] lg:min-h-[340px]">
                  <img
                    src={config.about_image_url}
                    alt={config.about_title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Features */}
        {config.show_features_section && (
          <section ref={featuresRef}>
            <h2 className="text-xl sm:text-2xl font-bold text-navy mb-4">{config.features_title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: config.feature_1_icon, title: config.feature_1_title, desc: config.feature_1_description },
                { icon: config.feature_2_icon, title: config.feature_2_title, desc: config.feature_2_description },
                { icon: config.feature_3_icon, title: config.feature_3_title, desc: config.feature_3_description },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-border rounded-lg p-6 hover:border-primary/40 transition-colors"
                >
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="text-lg font-bold text-navy mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Galerij */}
        {config.show_gallery && galleryImages.length > 0 && (
          <section ref={galleryRef}>
            <h2 className="text-xl sm:text-2xl font-bold text-navy mb-4">{config.gallery_title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(showAllGallery ? galleryImages : galleryImages.slice(0, 3)).map((image, idx) => (
                <div
                  key={image.id}
                  className="bg-white border border-border rounded-lg overflow-hidden group"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={image.image_url}
                      alt={image.title || `Galerij ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  {image.title && (
                    <p className="px-4 py-3 text-sm font-medium text-navy">{image.title}</p>
                  )}
                </div>
              ))}
            </div>
            {galleryImages.length > 3 && (
              <div className="text-center mt-5">
                <Button onClick={() => setShowAllGallery(!showAllGallery)} variant="outline">
                  {showAllGallery ? "Toon minder" : `Bekijk alle ${galleryImages.length} foto's`}
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showAllGallery ? "rotate-180" : ""}`} />
                </Button>
              </div>
            )}
          </section>
        )}

        {/* CTA */}
        {config.show_cta_section && (
          <section className="bg-navy rounded-lg p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{config.cta_section_title}</h2>
            <p className="text-white/70 max-w-2xl mx-auto mb-6">{config.cta_section_description}</p>
            {config.discord_link && (
              <Button asChild size="lg">
                <a href={config.discord_link} target="_blank" rel="noopener noreferrer">
                  {config.cta_button_text}
                </a>
              </Button>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-navy text-white/70 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={hdrpLogo} alt="HDRP logo" className="h-8 w-8 object-contain brightness-0 invert" />
                <div className="leading-none">
                  <p className="font-heading font-bold text-white">HDRP</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">Hoofddorp Roleplay</p>
                </div>
              </div>
              <p className="text-sm max-w-sm">
                {config?.footer_description || "Nederlandse Roblox roleplay-community met focus op realisme en kwaliteit."}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white text-sm uppercase tracking-wider">Links</h4>
              <div className="space-y-2 text-sm">
                <Link to="/regels" className="block hover:text-white transition-colors">Regels</Link>
                <Link to="/shop" className="block hover:text-white transition-colors">Shop</Link>
                <Link to="/support" className="block hover:text-white transition-colors">Support</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white text-sm uppercase tracking-wider">Community</h4>
              {config.discord_link && (
                <a
                  href={config.discord_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm hover:text-white transition-colors"
                >
                  Discord
                </a>
              )}
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-xs">© 2025 HDRP Hoofddorp Roleplay. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};


export default Home;
