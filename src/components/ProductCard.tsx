import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface Product {
  id: string;
  name: string;
  images: string[];
  price: string;
  description: string;
  details: string;
  coming_soon?: boolean;
  discounted_price?: string;
}

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export const ProductCard = ({ product, onClick }: ProductCardProps) => {
  const hasImages = product.images && product.images.length > 0;
  const parsePrice = (s: string) => parseFloat(s.replace('€', '').replace(',', '.'));
  const hasDiscount = !!product.discounted_price && parsePrice(product.discounted_price) < parsePrice(product.price);
  
  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-glow hover:scale-105 border-border/50"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="aspect-[4/3] overflow-hidden bg-secondary flex items-center justify-center relative">
          {product.coming_soon ? (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <p className="text-primary font-bold text-lg px-4 text-center">Binnenkort Beschikbaar</p>
            </div>
          ) : hasImages ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-muted-foreground text-sm">Geen afbeelding</div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-base text-foreground mb-1">{product.name}</h3>
          {product.coming_soon ? (
            <p className="text-primary font-bold">Binnenkort Beschikbaar</p>
          ) : hasDiscount ? (
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground line-through text-sm">{product.price}</p>
              <p className="text-primary font-bold">{product.discounted_price}</p>
            </div>
          ) : (
            <p className="text-primary font-bold">{product.price}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
