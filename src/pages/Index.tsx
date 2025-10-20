import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ProductCard, Product } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search } from "lucide-react";
import { Label } from "@/components/ui/label";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryLabel, setCategoryLabel] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("price-asc");
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [priceFilter, setPriceFilter] = useState<number>(1000);

  useEffect(() => {
    if (activeCategory) {
      loadProducts();
    }
  }, [activeCategory]);

  const loadProducts = async () => {
    if (!activeCategory) return;
    
    setLoading(true);
    
    // Haal categorie label op
    const { data: categoryData } = await supabase
      .from('categories')
      .select('label')
      .eq('id', activeCategory)
      .single();
    
    if (categoryData) {
      setCategoryLabel(categoryData.label);
    }

    // Haal producten op met hun afbeeldingen
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
      .eq('active', true)
      .order('display_order');

    if (productsData) {
      const formattedProducts: Product[] = productsData.map((p: any) => ({
        id: p.id,
        name: p.name,
        images: p.product_images
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((img: any) => img.image_url),
        price: `€${parseFloat(p.price).toFixed(2).replace('.', ',')}`,
        discounted_price: p.discounted_price ? `€${parseFloat(p.discounted_price).toFixed(2).replace('.', ',')}` : undefined,
        description: p.description || '',
        details: p.details || '',
        coming_soon: p.coming_soon || false,
      }));
      setProducts(formattedProducts);
      
      // Set max price based on products
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
    <div className="flex flex-col sm:flex-row min-h-screen bg-background">
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
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Zoek producten..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Sorteer op" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price-asc">Prijs: Laag - Hoog</SelectItem>
                      <SelectItem value="price-desc">Prijs: Hoog - Laag</SelectItem>
                      <SelectItem value="name-asc">Naam: A - Z</SelectItem>
                      <SelectItem value="name-desc">Naam: Z - A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Max. Prijs: €{priceFilter}</Label>
                  <Slider
                    value={[priceFilter]}
                    onValueChange={(value) => setPriceFilter(value[0])}
                    max={maxPrice}
                    min={0}
                    step={1}
                    className="w-full"
                  />
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

      <ProductModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default Index;