import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

interface HomeConfig {
  banner_image_url: string | null;
  banner_title: string;
  banner_subtitle: string | null;
  discord_link: string | null;
  show_banner: boolean;
}

const Home = () => {
  const [config, setConfig] = useState<HomeConfig | null>(null);

  useEffect(() => {
    loadConfig();
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar discordLink={config?.discord_link} />
      
      {/* Hero/Banner Section */}
      {config?.show_banner && (
        <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
          {config.banner_image_url && (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${config.banner_image_url})` }}
            >
              <div className="absolute inset-0 bg-black/50" />
            </div>
          )}
          
          <div className="relative z-10 text-center space-y-6 px-4 max-w-4xl">
            <h1 className="text-4xl sm:text-6xl font-bold text-white animate-fade-in">
              {config?.banner_title}
            </h1>
            {config?.banner_subtitle && (
              <p className="text-xl sm:text-2xl text-white/90 animate-fade-in">
                {config.banner_subtitle}
              </p>
            )}
            <div className="flex gap-4 justify-center animate-fade-in">
              <Button asChild size="lg" variant="glow">
                <Link to="/shop">Bekijk Shop</Link>
              </Button>
              {config?.discord_link && (
                <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                  <a href={config.discord_link} target="_blank" rel="noopener noreferrer">
                    Join Discord
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4 p-6 rounded-lg bg-card border border-border hover:shadow-glow transition-all">
              <div className="text-4xl">🎮</div>
              <h3 className="text-xl font-semibold text-foreground">Premium Producten</h3>
              <p className="text-muted-foreground">Ontdek onze exclusieve collectie</p>
            </div>
            <div className="text-center space-y-4 p-6 rounded-lg bg-card border border-border hover:shadow-glow transition-all">
              <div className="text-4xl">⚡</div>
              <h3 className="text-xl font-semibold text-foreground">Snelle Levering</h3>
              <p className="text-muted-foreground">Direct beschikbaar na aankoop</p>
            </div>
            <div className="text-center space-y-4 p-6 rounded-lg bg-card border border-border hover:shadow-glow transition-all">
              <div className="text-4xl">🛡️</div>
              <h3 className="text-xl font-semibold text-foreground">Veilig & Betrouwbaar</h3>
              <p className="text-muted-foreground">100% veilige transacties</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
