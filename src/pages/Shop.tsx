import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ProductCard, Product } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, Filter } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Navbar } from "@/components/Navbar";

const Shop = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryLabel, setCategoryLabel] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>("price-asc");
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [priceFilter, setPriceFilter] = useState<number>(1000);
  const [filterOpen, setFilterOpen] = useState(false);
  const [discordLink, setDiscordLink] = useState<string | null>(null);

  useEffect(() => {
    loadDiscordLink();
  }, []);

  useEffect(() => {
    if (activeCategory) {
      loadProducts();
    }
  }, [activeCategory]);

  // Realtime: update prijzen direct bij wijzigingen
  useEffect(() => {
    if (!activeCategory) return;
    const channel = supabase
      .channel('products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        loadProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeCategory]);

  const loadDiscordLink = async () => {
    const { data } = await supabase
      .from('home_config')
      .select('discord_link')
      .single();
    
    if (data) {
      setDiscordLink(data.discord_link);
    }
  };

  const loadProducts = async () => {
    if (!activeCategory) return;
    
    setLoading(true);
    
    const { data: categoryData } = await supabase
      .from('categories')
      .select('label')
      .eq('id', activeCategory)
      .single();
    
    if (categoryData) {
      setCategoryLabel(categoryData.label);
    }

    const { data: productsData } = await supabase
      .from('products')
      .select(`
        *,
        product_images (
          image_url,
          display_order
        )
      `)
      .eq('category_id', activeCategory)
      .eq('active', true);

    if (productsData) {
      const now = new Date();
      const formattedProducts: Product[] = productsData
        .map((p: any) => {
          const isLimited = p.limited && 
            (!p.limited_start_date || new Date(p.limited_start_date) <= now) &&
            (!p.limited_end_date || new Date(p.limited_end_date) >= now);
          
          return {
            id: p.id,
            name: p.name,
            images: p.product_images
              .sort((a: any, b: any) => a.display_order - b.display_order)
              .map((img: any) => img.image_url),
            price: `€${parseFloat(p.price).toFixed(2).replace('.', ',')}`,
            discounted_price: p.discounted_price != null
              ? `€${parseFloat(p.discounted_price).toFixed(2).replace('.', ',')}`
              : undefined,
            description: p.description || '',
            details: p.details || '',
            coming_soon: p.coming_soon || false,
            limited: isLimited,
            is_new: p.is_new || false,
            sound_url: p.sound_url || null,
            sound_duration: p.sound_duration || null,
            photo_display_count: p.photo_display_count || 1,
          };
        })
        .sort((a: any, b: any) => {
          // Nieuwe producten eerst
          if (a.is_new && !b.is_new) return -1;
          if (!a.is_new && b.is_new) return 1;
          // Dan limited producten
          if (a.limited && !b.limited) return -1;
          if (!a.limited && b.limited) return 1;
          return 0;
        });

      setProducts(formattedProducts);
      
      if (formattedProducts.length > 0) {
        const prices = formattedProducts.map(p => {
          const priceStr = p.discounted_price || p.price;
          return parseFloat(priceStr.replace('€', '').replace(',', '.'));
        });
        const max = Math.ceil(Math.max(...prices));
        setMaxPrice(max);
        setPriceFilter(max);
      }
    }
    setLoading(false);
  };

  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const priceStr = product.discounted_price || product.price;
      const price = parseFloat(priceStr.replace('€', '').replace(',', '.'));
      const matchesPrice = price <= priceFilter;
      return matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      // Altijd eerst nieuwe producten, dan limited
      if (a.is_new && !b.is_new) return -1;
      if (!a.is_new && b.is_new) return 1;
      if (a.limited && !b.limited) return -1;
      if (!a.limited && b.limited) return 1;
      
      // Dan de normale sortering
      const priceStrA = a.discounted_price || a.price;
      const priceStrB = b.discounted_price || b.price;
      const priceA = parseFloat(priceStrA.replace('€', '').replace(',', '.'));
      const priceB = parseFloat(priceStrB.replace('€', '').replace(',', '.'));
      
      switch (sortBy) {
        case 'price-asc':
          return priceA - priceB;
        case 'price-desc':
          return priceB - priceA;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar discordLink={discordLink} />
      
      <div className="flex flex-col sm:flex-row">
        <Sidebar 
          activeCategory={activeCategory} 
          onCategoryChange={setActiveCategory}
        />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeCategory && (
              <>
                <div className="mb-6 space-y-4">
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{categoryLabel}</h2>
                  
                  <div className="flex gap-2">
                    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Search className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Zoek producten</DialogTitle>
                        <DialogDescription>Zoek op naam of beschrijving</DialogDescription>
                      </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Zoek producten..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                          />
                          <Button onClick={() => setSearchOpen(false)} className="w-full">
                            Zoeken
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Sorteer op" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price-asc">Prijs: Laag - Hoog</SelectItem>
                        <SelectItem value="price-desc">Prijs: Hoog - Laag</SelectItem>
                        <SelectItem value="name-asc">Naam: A - Z</SelectItem>
                        <SelectItem value="name-desc">Naam: Z - A</SelectItem>
                      </SelectContent>
                    </Select>

                    <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-4">
                          <h4 className="font-medium leading-none">Max. Prijs</h4>
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">€{priceFilter}</Label>
                            <Slider
                              value={[priceFilter]}
                              onValueChange={(value) => setPriceFilter(value[0])}
                              max={maxPrice}
                              min={0}
                              step={1}
                              className="w-full"
                            />
                          </div>
                          <Button onClick={() => setFilterOpen(false)} className="w-full">
                            Toepassen
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {loading ? (
                  <div className="text-center text-muted-foreground">Laden...</div>
                ) : filteredAndSortedProducts.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    Geen producten gevonden
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {filteredAndSortedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onClick={() => handleProductClick(product)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <ProductModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default Shop;
