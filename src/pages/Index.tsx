import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ProductCard, Product } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { supabase } from "@/integrations/supabase/client";

interface DbProduct {
  id: string;
  name: string;
  price: number;
  description: string | null;
  details: string | null;
  category_id: string;
  active: boolean;
}

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState<string>("");

  useEffect(() => {
    if (activeCategory) {
      loadProducts();
    }
  }, [activeCategory]);

  const loadProducts = async () => {
    if (!activeCategory) return;

    // Haal producten op met images
    const { data: productsData } = await supabase
      .from('products')
      .select(`
        *,
        product_images(image_url, display_order)
      `)
      .eq('category_id', activeCategory)
      .eq('active', true)
      .order('display_order');

    // Haal categorienaam op
    const { data: categoryData } = await supabase
      .from('categories')
      .select('label')
      .eq('id', activeCategory)
      .single();

    if (categoryData) {
      setCategoryName(categoryData.label);
    }

    if (productsData) {
      const formattedProducts: Product[] = productsData.map((p: any) => ({
        id: p.id,
        name: p.name,
        images: p.product_images
          ?.sort((a: any, b: any) => a.display_order - b.display_order)
          .map((img: any) => img.image_url) || [],
        price: `€${p.price.toFixed(2).replace('.', ',')}`,
        description: p.description || '',
        details: p.details || '',
      }));
      setProducts(formattedProducts);
    }
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
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8 text-foreground capitalize">
            {categoryName}
          </h2>
          
          {products.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              Geen producten gevonden in deze categorie. Voeg ze toe via het admin panel!
            </p>
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
