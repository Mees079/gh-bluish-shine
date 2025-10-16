import { useState } from "react";
import { Sidebar, Category } from "@/components/Sidebar";
import { ProductCard } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { Product } from "@/components/ProductCard";
import { products } from "@/data/products";
import { FooterLogin } from "@/components/auth/FooterLogin";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<Category>("Aankoop pakketen");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
            {activeCategory}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products[activeCategory].map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product)}
              />
            ))}
          </div>
        </div>
      </main>

      <FooterLogin />

      <ProductModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default Index;
