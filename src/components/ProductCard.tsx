import { Card, CardContent } from "@/components/ui/card";

export interface Product {
  id: string;
  name: string;
  image: string;
  price: string;
  description: string;
  details: string;
}

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export const ProductCard = ({ product, onClick }: ProductCardProps) => {
  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-glow hover:scale-105 border-border/50"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="aspect-video overflow-hidden bg-secondary">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg text-foreground mb-1">{product.name}</h3>
          <p className="text-primary font-bold">{product.price}</p>
        </div>
      </CardContent>
    </Card>
  );
};
