import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import placeholderImage from "@/assets/placeholder.png";

export interface Product {
  id: string;
  name: string;
  images: string[];
  price: string;
  description: string;
  details: string;
  coming_soon?: boolean;
  discounted_price?: string;
  limited?: boolean;
  is_new?: boolean;
  sound_url?: string | null;
  photo_display_count?: number;
}

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export const ProductCard = ({ product, onClick }: ProductCardProps) => {
  const hasImages = product.images && product.images.length > 0;
  const parsePrice = (s: string) => parseFloat(s.replace('€', '').replace(',', '.'));
  const hasDiscount = !!product.discounted_price && parsePrice(product.discounted_price) < parsePrice(product.price);
  const photoCount = Math.min(product.photo_display_count || 1, product.images?.length || 1);
  
  const handleClick = () => {
    // Speel geluid af als het er is
    if (product.sound_url) {
      const audio = new Audio(product.sound_url);
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore errors als audio niet kan afspelen
      });
    }
    onClick();
  };
  
  const renderImages = () => {
    if (product.coming_soon) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-primary/10">
          <p className="text-primary font-bold text-lg px-4 text-center">Binnenkort Beschikbaar</p>
        </div>
      );
    }

    if (!hasImages) {
      return (
        <img
          src={placeholderImage}
          alt="Placeholder"
          className="w-full h-full object-cover"
        />
      );
    }

    if (photoCount === 1) {
      return (
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      );
    }

    if (photoCount === 2) {
      return (
        <div className="grid grid-cols-2 gap-0.5 h-full">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <img
            src={product.images[1] || placeholderImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    if (photoCount === 3) {
      return (
        <div className="grid grid-cols-2 gap-0.5 h-full">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover col-span-1 row-span-2"
          />
          <img
            src={product.images[1] || placeholderImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <img
            src={product.images[2] || placeholderImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    if (photoCount >= 4) {
      return (
        <div className="grid grid-cols-2 gap-0.5 h-full">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <img
            src={product.images[1] || placeholderImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <img
            src={product.images[2] || placeholderImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <img
            src={product.images[3] || placeholderImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
  };
  
  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-glow hover:scale-105",
        product.limited && "border-2 border-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]",
        !product.limited && "border-border/50"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-0">
        <div className="aspect-[4/3] overflow-hidden bg-secondary flex items-center justify-center relative">
          {renderImages()}
          <div className="absolute top-2 left-2 flex gap-2">
            {product.is_new && (
              <Badge className="bg-green-500 hover:bg-green-600 text-white font-bold animate-bounce">
                NIEUW
              </Badge>
            )}
            {product.limited && (
              <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold animate-pulse">
                LIMITED
              </Badge>
            )}
          </div>
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
