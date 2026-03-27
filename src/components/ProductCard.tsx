import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import placeholderImage from "@/assets/placeholder.png";

export type LimitedGradient = 'blue-purple-pink' | 'gold' | 'red-orange' | 'green-teal' | 'rainbow' | 'ice' | 'fire' | 'custom';
export type LimitedEffect = 'none' | 'pulse' | 'glow' | 'shake' | 'sparkle';

export const GRADIENT_PRESETS: Record<string, string> = {
  'blue-purple-pink': 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)',
  'gold': 'linear-gradient(90deg, #f59e0b, #eab308, #fbbf24, #f59e0b)',
  'red-orange': 'linear-gradient(90deg, #ef4444, #f97316, #ef4444)',
  'green-teal': 'linear-gradient(90deg, #10b981, #14b8a6, #06b6d4, #10b981)',
  'rainbow': 'linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6, #ef4444)',
  'ice': 'linear-gradient(90deg, #67e8f9, #a5f3fc, #e0f2fe, #67e8f9)',
  'fire': 'linear-gradient(90deg, #dc2626, #f97316, #fbbf24, #dc2626)',
};

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
  sound_duration?: number | null;
  photo_display_count?: number;
  stock_quantity?: number | null;
  limited_gradient?: string;
  limited_effect?: string;
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
  
  // Cooldown tracking per product
  const lastPlayTime = (window as any)[`lastSound_${product.id}`] || 0;
  
  const handleClick = () => {
    // Check cooldown (15 seconden)
    const now = Date.now();
    if (product.sound_url && (now - lastPlayTime) > 15000) {
      const audio = new Audio(product.sound_url);
      audio.volume = 0.5;
      
      // Stop na sound_duration seconden als ingesteld
      if (product.sound_duration && product.sound_duration > 0) {
        setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
        }, product.sound_duration * 1000);
      }
      
      audio.play().catch(() => {
        // Ignore errors als audio niet kan afspelen
      });
      
      // Update last play time
      (window as any)[`lastSound_${product.id}`] = now;
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
    const gradientBg = product.limited
      ? GRADIENT_PRESETS[product.limited_gradient || 'blue-purple-pink'] || GRADIENT_PRESETS['blue-purple-pink']
      : undefined;

    const effectClass = product.limited && product.limited_effect && product.limited_effect !== 'none'
      ? `limited-effect-${product.limited_effect}`
      : '';

    return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-glow hover:scale-105 relative",
        product.limited && "p-[3px]",
        !product.limited && "border-border/50",
        effectClass
      )}
      onClick={handleClick}
      style={product.limited ? {
        background: gradientBg,
        backgroundSize: "300% 100%",
        animation: "limited-border 8s ease infinite"
      } : undefined}
    >
      <div className={cn("overflow-hidden", product.limited && "bg-background rounded-lg")}>
        <CardContent className="p-0">
          <div className="aspect-[4/3] overflow-hidden bg-secondary flex items-center justify-center relative">
            {renderImages()}
            <div className="absolute top-2 left-2 flex gap-2 flex-wrap max-w-[calc(100%-1rem)]">
              {product.is_new && (
                <Badge className="bg-green-500 hover:bg-green-600 text-white font-bold animate-bounce">
                  NIEUW
                </Badge>
              )}
              {product.limited && (
                <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  LIMITED
                </Badge>
              )}
              {product.stock_quantity !== null && product.stock_quantity !== undefined && (
                <Badge 
                  variant={product.stock_quantity === 0 ? "destructive" : "secondary"} 
                  className="shadow-lg font-bold"
                >
                  {product.stock_quantity === 0 ? 'OP=OP' : `In stock: ${product.stock_quantity}`}
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
      </div>
    </Card>
  );
};
