import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { ChevronDown } from "lucide-react";

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
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {config.hero_image_url ? (
          <div 
            className="absolute inset-0 bg-cover bg-center animate-fade-in"
            style={{ backgroundImage: `url(${config.hero_image_url})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        )}
        
        <div className="relative z-10 text-center space-y-8 px-4 max-w-5xl animate-fade-in">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold text-foreground drop-shadow-2xl">
            {config.hero_title}
          </h1>
          {config.hero_subtitle && (
            <p className="text-xl sm:text-3xl text-foreground/90 font-light drop-shadow-lg">
              {config.hero_subtitle}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {config.hero_cta_link && (
              <Button asChild size="lg" variant="glow" className="text-lg px-8 py-6">
                <Link to={config.hero_cta_link}>
                  {config.hero_cta_text || "Start Nu"}
                </Link>
              </Button>
            )}
            {config.discord_link && (
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 border-2">
                <a href={config.discord_link} target="_blank" rel="noopener noreferrer">
                  Join Discord
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <button 
          onClick={scrollToContent}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-foreground/60 hover:text-foreground transition-colors"
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
                <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
                  {config.about_title}
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {config.about_content}
                </p>
                <Button asChild size="lg" variant="glow">
                  <Link to="/shop">Bezoek Shop</Link>
                </Button>
              </div>
              
              {config.about_image_url && (
                <div className="relative h-96 rounded-2xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-500 animate-fade-in">
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
            <h2 className="text-4xl sm:text-5xl font-bold text-center text-foreground mb-16 animate-fade-in">
              {config.features_title}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: config.feature_1_icon, title: config.feature_1_title, desc: config.feature_1_description },
                { icon: config.feature_2_icon, title: config.feature_2_title, desc: config.feature_2_description },
                { icon: config.feature_3_icon, title: config.feature_3_title, desc: config.feature_3_description },
              ].map((feature, idx) => (
                <div 
                  key={idx}
                  className="group relative p-8 rounded-2xl bg-background border border-border hover:border-primary transition-all duration-300 hover:shadow-glow animate-fade-in"
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
            <h2 className="text-4xl sm:text-5xl font-bold text-center text-foreground mb-16 animate-fade-in">
              {config.gallery_title}
            </h2>
            
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
              <Button asChild size="lg" variant="glow" className="text-lg px-12 py-6">
                <a href={config.discord_link} target="_blank" rel="noopener noreferrer">
                  {config.cta_button_text}
                </a>
              </Button>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <p className="text-muted-foreground">
            © 2025 HDRP Hoofddorp Roleplay. Alle rechten voorbehouden.
          </p>
          <div className="flex justify-center gap-6">
            <Link to="/regels" className="text-muted-foreground hover:text-primary transition-colors">
              Regels
            </Link>
            <Link to="/shop" className="text-muted-foreground hover:text-primary transition-colors">
              Shop
            </Link>
            {config.discord_link && (
              <a 
                href={config.discord_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Discord
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
