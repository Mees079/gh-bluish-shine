import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ProductCard } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { Product } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryLabel, setCategoryLabel] = useState<string>("");
  const [loading, setLoading] = useState(false);

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
        description: p.description || '',
        details: p.details || '',
      }));
      setProducts(formattedProducts);
    }
    setLoading(false);
  };

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
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8 text-foreground">
                {categoryLabel}
              </h2>
              
              {loading ? (
                <div className="text-muted-foreground">Producten laden...</div>
              ) : products.length === 0 ? (
                <div className="text-muted-foreground">Geen producten beschikbaar in deze categorie</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {products.map((product) => (
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