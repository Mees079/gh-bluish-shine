import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { ChevronDown, Users, Server, Shield, Zap } from "lucide-react";
import heroBanner from "@/assets/hero-banner.png";
import { Card } from "@/components/ui/card";

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background shapes with hexagons */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Glowing orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse opacity-30" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse opacity-25" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse opacity-20" style={{ animationDuration: '5s' }} />
        
        {/* Animated hexagon shapes */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 animate-float-slow opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25" 
              fill="none" stroke="hsl(var(--primary))" strokeWidth="2"
              className="animate-pulse" style={{ animationDuration: '3s' }}/>
            <polygon points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25" 
              fill="hsl(var(--primary) / 0.05)" className="blur-sm"/>
          </svg>
        </div>
        
        <div className="absolute top-2/3 right-1/4 w-24 h-24 animate-float-medium opacity-15">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25" 
              fill="none" stroke="hsl(var(--primary))" strokeWidth="2"
              className="animate-pulse" style={{ animationDuration: '4s' }}/>
            <polygon points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25" 
              fill="hsl(var(--primary) / 0.08)" className="blur-sm"/>
          </svg>
        </div>
        
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 animate-float-fast opacity-12">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25" 
              fill="none" stroke="hsl(var(--primary-glow))" strokeWidth="2"
              className="animate-pulse" style={{ animationDuration: '2.5s' }}/>
            <polygon points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25" 
              fill="hsl(var(--primary-glow) / 0.1)" className="blur-sm"/>
          </svg>
        </div>
        
        <div className="absolute top-1/2 right-1/3 w-28 h-28 animate-float-medium opacity-10" style={{ animationDelay: '1s' }}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25" 
              fill="none" stroke="hsl(var(--primary))" strokeWidth="2"
              className="animate-pulse" style={{ animationDuration: '3.5s' }}/>
            <polygon points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25" 
              fill="hsl(var(--primary) / 0.06)" className="blur-sm"/>
          </svg>
        </div>
      </div>

      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Hero background with overlay */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${config.hero_image_url || heroBanner})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-background" />
        </div>
        
        {/* Hero content */}
        <div className="relative z-10 text-center space-y-8 px-4 max-w-6xl">
          <div className="inline-block px-6 py-2 bg-primary/20 border border-primary/50 rounded-full backdrop-blur-md mb-4 animate-fade-in">
            <span className="text-primary font-semibold">🎮 Nu Live & Speelbaar</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold text-white drop-shadow-2xl leading-tight animate-fade-in">
            {config.hero_title}
          </h1>
          
          {config.hero_subtitle && (
            <p className="text-2xl sm:text-3xl text-white/90 font-light drop-shadow-lg max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
              {config.hero_subtitle}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {config.roblox_link ? (
              <Button asChild size="lg" variant="glow" className="text-lg px-10 py-7 text-xl">
                <a 
                  href={config.roblox_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {config.hero_cta_text || "Start Nu"} →
                </a>
              </Button>
            ) : (
              <Button asChild size="lg" variant="glow" className="text-lg px-10 py-7 text-xl">
                <Link to={config.hero_cta_link || "/shop"}>
                  {config.hero_cta_text || "Start Nu"} →
                </Link>
              </Button>
            )}
            {config.discord_link && (
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="text-lg px-10 py-7 text-xl border-2 border-white text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <a 
                  href={config.discord_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Join Discord
                </a>
              </Button>
            )}
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 pt-12 max-w-5xl mx-auto">
            {stats.map((stat, idx) => {
              const IconComponent = iconMap[stat.icon] || Users;
              return (
                <Card 
                  key={stat.id}
                  className="bg-background/80 backdrop-blur-md border-primary/30 p-4 lg:p-6 hover:border-primary hover:shadow-glow transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${idx * 0.1 + 0.3}s` }}
                >
                  <IconComponent className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs lg:text-sm text-muted-foreground">{stat.label}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Scroll indicator */}
        <button 
          onClick={scrollToContent}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/80 hover:text-white transition-colors"
          aria-label="Scroll naar content"
        >
          <ChevronDown className="h-12 w-12" />
        </button>
      </section>

      {/* Unified Content Section with smooth transitions */}
      <section className="relative py-24 px-4">
        {/* Decorative shape divider */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent" />
        
        <div className="max-w-7xl mx-auto space-y-32">
          {/* About Section */}
          {config.show_about_section && (
            <div ref={aboutRef} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center opacity-0 transition-opacity duration-1000">
              <div className="space-y-6">
                <div className="inline-block px-4 py-1 bg-primary/10 border border-primary/30 rounded-full mb-2">
                  <span className="text-primary font-semibold text-sm">Over Ons</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
                  {config.about_title}
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {config.about_content}
                </p>
                <div className="flex gap-4 pt-4">
                  <Button asChild size="lg" variant="glow">
                    <Link to="/shop">Bezoek Shop</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/regels">Bekijk Regels</Link>
                  </Button>
                </div>
              </div>
              
              {config.about_image_url && (
                <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-500 animate-fade-in group">
                  <img 
                    src={config.about_image_url} 
                    alt={config.about_title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              )}
            </div>
          )}

          {/* Features Section */}
          {config.show_features_section && (
            <div ref={featuresRef} className="opacity-0 transition-opacity duration-1000">
              <div className="text-center mb-16">
                <div className="inline-block px-4 py-1 bg-primary/10 border border-primary/30 rounded-full mb-4">
                  <span className="text-primary font-semibold text-sm">Features</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
                  {config.features_title}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { icon: config.feature_1_icon, title: config.feature_1_title, desc: config.feature_1_description },
                  { icon: config.feature_2_icon, title: config.feature_2_title, desc: config.feature_2_description },
                  { icon: config.feature_3_icon, title: config.feature_3_title, desc: config.feature_3_description },
                ].map((feature, idx) => (
                  <Card 
                    key={idx}
                    className="group relative p-8 bg-card/50 backdrop-blur-sm border-2 border-border hover:border-primary transition-all duration-500 hover:shadow-glow overflow-hidden animate-slide-in"
                    style={{ 
                      animationDelay: `${idx * 0.2}s`
                    }}
                  >
                    {/* Animated background gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/10 transition-all duration-500" />
                    
                    <div className="relative z-10">
                      <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-500">
                        {feature.icon}
                      </div>
                      <h3 className="text-2xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Gallery Section */}
          {config.show_gallery && galleryImages.length > 0 && (
            <div ref={galleryRef} className="opacity-0 transition-opacity duration-1000 ease-out">
              <div className="text-center mb-16">
                <div className="inline-block px-4 py-1 bg-primary/10 border border-primary/30 rounded-full mb-4">
                  <span className="text-primary font-semibold text-sm">Galerij</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
                  {config.gallery_title}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(showAllGallery ? galleryImages : galleryImages.slice(0, 3)).map((image, idx) => (
                  <div 
                    key={image.id}
                    className="relative h-64 rounded-2xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-500 group animate-fade-in"
                    style={{ animationDelay: `${idx * 0.15}s` }}
                  >
                    <img 
                      src={image.image_url} 
                      alt={image.title || `Gallery ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {image.title && (
                      <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-white text-lg font-semibold">{image.title}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {galleryImages.length > 3 && (
                <div className="text-center mt-8">
                  <Button 
                    onClick={() => setShowAllGallery(!showAllGallery)}
                    variant="outline"
                    size="lg"
                    className="group"
                  >
                    {showAllGallery ? 'Toon Minder' : `Bekijk Alle ${galleryImages.length} Foto's`}
                    <ChevronDown className={`ml-2 h-4 w-4 transition-transform duration-300 ${showAllGallery ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* CTA Section */}
          {config.show_cta_section && (
            <div className="relative">
              <Card className="relative p-16 bg-gradient-to-br from-primary/10 via-background to-primary/5 border-primary/30 overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                
                <div className="relative z-10 text-center space-y-8 animate-fade-in">
                  <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
                    {config.cta_section_title}
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    {config.cta_section_description}
                  </p>
                  {config.discord_link && (
                    <Button asChild size="lg" variant="glow" className="text-lg px-12 py-7 text-xl">
                      <a 
                        href={config.discord_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {config.cta_button_text} →
                      </a>
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/50 py-12 px-4 mt-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4 text-foreground">HDRP</h3>
              <p className="text-muted-foreground text-sm">
                {config?.footer_description || "De beste Nederlandse Roblox roleplay server met realisme en kwaliteit."}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Links</h4>
              <div className="space-y-2">
                <Link to="/regels" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                  Regels
                </Link>
                <Link to="/shop" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                  Shop
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Community</h4>
              {config.discord_link && (
                <a 
                  href={config.discord_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Discord
                </a>
              )}
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 text-center">
            <p className="text-muted-foreground text-sm">
              © 2025 HDRP Hoofddorp Roleplay. Alle rechten voorbehouden.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
