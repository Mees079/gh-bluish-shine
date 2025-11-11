import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { ChevronDown, Shield, Users, Zap, Server } from "lucide-react";
import heroBanner from "@/assets/hero-banner.png";

interface HomeConfig {
  hero_image_url: string | null;
  hero_title: string;
  hero_subtitle: string | null;
  hero_cta_text: string | null;
  hero_cta_link: string | null;
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
  show_about_section: boolean;
  show_features_section: boolean;
  show_cta_section: boolean;
}

interface GalleryImage {
  id: string;
  image_url: string;
  title: string | null;
}

const Home = () => {
  const [config, setConfig] = useState<HomeConfig | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  useEffect(() => {
    loadConfig();
    loadGallery();
  }, []);

  const loadConfig = async () => {
    const { data } = await supabase
      .from('home_config')
      .select('*')
      .single();
    
    if (data) {
      setConfig(data);
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section with Police Banner */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center animate-fade-in"
          style={{ backgroundImage: `url(${config.hero_image_url || heroBanner})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-background" />
        </div>
        
        <div className="relative z-10 text-center space-y-8 px-4 max-w-6xl animate-fade-in">
          <div className="inline-block px-6 py-2 bg-primary/20 border border-primary/50 rounded-full backdrop-blur-sm mb-4">
            <span className="text-primary font-semibold">🎮 Nu Live & Speelbaar</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold text-white drop-shadow-2xl leading-tight">
            {config.hero_title}
          </h1>
          
          {config.hero_subtitle && (
            <p className="text-2xl sm:text-3xl text-white/90 font-light drop-shadow-lg max-w-3xl mx-auto">
              {config.hero_subtitle}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button asChild size="lg" variant="glow" className="text-lg px-10 py-7 text-xl">
              <Link to={config.hero_cta_link || "/shop"}>
                {config.hero_cta_text || "Start Nu"} →
              </Link>
            </Button>
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-12 max-w-4xl mx-auto">
            {[
              { icon: Users, label: "Actieve Community", value: "500+" },
              { icon: Server, label: "Uptime", value: "99.9%" },
              { icon: Shield, label: "Staff Online", value: "24/7" },
              { icon: Zap, label: "Updates", value: "Wekelijks" },
            ].map((stat, idx) => (
              <div 
                key={idx}
                className="bg-background/10 backdrop-blur-md border border-white/20 rounded-xl p-4 animate-fade-in"
                style={{ animationDelay: `${idx * 0.1 + 0.3}s` }}
              >
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/70">{stat.label}</p>
              </div>
            ))}
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

      {/* About Section */}
      {config.show_about_section && (
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 animate-fade-in">
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
                <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-500 animate-fade-in">
                  <img 
                    src={config.about_image_url} 
                    alt={config.about_title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      {config.show_features_section && (
        <section className="py-24 px-4 bg-card/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
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
                <div 
                  key={idx}
                  className="group relative p-8 rounded-2xl bg-background border-2 border-border hover:border-primary transition-all duration-300 hover:shadow-glow animate-fade-in"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {config.show_gallery && galleryImages.length > 0 && (
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <div className="inline-block px-4 py-1 bg-primary/10 border border-primary/30 rounded-full mb-4">
                <span className="text-primary font-semibold text-sm">Galerij</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
                {config.gallery_title}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryImages.map((image, idx) => (
                <div 
                  key={image.id}
                  className="relative h-64 rounded-2xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-500 group animate-fade-in"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <img 
                    src={image.image_url} 
                    alt={image.title || `Gallery ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {image.title && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white text-lg font-semibold">{image.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {config.show_cta_section && (
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8 animate-fade-in">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
              {config.cta_section_title}
            </h2>
            <p className="text-xl text-muted-foreground">
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
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4 text-foreground">HDRP</h3>
              <p className="text-muted-foreground text-sm">
                De beste Nederlandse FiveM roleplay server met realisme en kwaliteit.
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
          <div className="border-t border-border pt-8 text-center">
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
