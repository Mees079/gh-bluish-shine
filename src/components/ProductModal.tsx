import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Product } from "./ProductCard";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { X } from "lucide-react";

interface ProductModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductModal = ({ product, open, onOpenChange }: ProductModalProps) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!product) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-foreground">{product.name}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {product.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Afbeeldingen Galerie */}
            <div className="space-y-3">
              {/* Hoofd Afbeelding */}
              <div 
                className="aspect-video overflow-hidden rounded-lg bg-secondary cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  setSelectedImage(0);
                  setLightboxOpen(true);
                }}
              >
                <img
                  src={product.images[selectedImage]}
                  alt={`${product.name} - foto ${selectedImage + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image, index) => (
                    <div
                      key={index}
                      className={`aspect-video overflow-hidden rounded-md cursor-pointer transition-all ${
                        selectedImage === index 
                          ? "ring-2 ring-primary shadow-glow" 
                          : "hover:ring-2 hover:ring-primary/50"
                      }`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img
                        src={image}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Beschrijving</h4>
                <p className="text-muted-foreground leading-relaxed">{product.details}</p>
              </div>

              {/* Aankoop Instructies */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-primary mb-2">📋 Hoe te kopen?</h4>
                <ol className="text-sm text-foreground space-y-2 list-decimal list-inside">
                  <li>Klik op "Koop Nu" hieronder</li>
                  <li className="font-semibold">Maak een AANKOOP ticket aan (GEEN vragen ticket!)</li>
                  <li>Vul het formulier in met je gegevens</li>
                  <li>Tag <span className="text-primary font-mono">@Mees_079_</span> in het ticket</li>
                  <li>Wacht op bevestiging en verdere instructies</li>
                </ol>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Prijs</p>
                  <p className="text-2xl font-bold text-primary">{product.price}</p>
                </div>
                <Button 
                  variant="glow" 
                  size="lg" 
                  className="rounded-full px-8"
                  asChild
                >
                  <a 
                    href="https://discord.com/channels/1032679994285109349/1302354288395419679" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Koop Nu
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox voor grote afbeeldingen */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] bg-black/95 border-primary/20 p-0">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-50 text-white hover:bg-white/20"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
          
          <Carousel className="w-full h-full">
            <CarouselContent>
              {product.images.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="flex items-center justify-center h-[95vh] p-8">
                    <img
                      src={image}
                      alt={`${product.name} - foto ${index + 1}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {product.images.length > 1 && (
              <>
                <CarouselPrevious className="left-4 bg-white/10 hover:bg-white/20 text-white border-white/20" />
                <CarouselNext className="right-4 bg-white/10 hover:bg-white/20 text-white border-white/20" />
              </>
            )}
          </Carousel>
        </DialogContent>
      </Dialog>
    </>
  );
};
