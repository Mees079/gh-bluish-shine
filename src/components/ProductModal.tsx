import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Product } from "./ProductCard";
import { Button } from "@/components/ui/button";

interface ProductModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductModal = ({ product, open, onOpenChange }: ProductModalProps) => {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground">{product.name}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {product.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="aspect-video overflow-hidden rounded-lg bg-secondary">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Beschrijving</h4>
              <p className="text-muted-foreground leading-relaxed">{product.details}</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Prijs</p>
                <p className="text-2xl font-bold text-primary">{product.price}</p>
              </div>
              <Button variant="glow" size="lg" className="rounded-full px-8">
                Koop Nu
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
