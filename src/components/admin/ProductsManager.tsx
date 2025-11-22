import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Upload, X, Search, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productSchema } from "@/lib/validation";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const ProductsManager = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [roundToNinetyNine, setRoundToNinetyNine] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [uploadingImages, setUploadingImages] = useState<FileList | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  // Set roundToNinetyNine to true by default when opening dialog
  useEffect(() => {
    if (dialogOpen && !editingProduct) {
      setRoundToNinetyNine(true);
    }
  }, [dialogOpen, editingProduct]);

  const loadData = async () => {
    setLoading(true);
    const [productsRes, categoriesRes, discountsRes] = await Promise.all([
      supabase.from('products').select('*, category:categories(*), images:product_images(*)').order('display_order'),
      supabase.from('categories').select('*').order('display_order'),
      supabase.from('discounts').select('*').eq('active', true)
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (discountsRes.data) setDiscounts(discountsRes.data);
    setLoading(false);
  };

  const getDiscountedPrice = (product: any) => {
    const basePrice = parseFloat(product.price);
    const now = new Date();

    const relevantDiscounts = discounts.filter((d: any) => {
      if (d.expires_at && new Date(d.expires_at) < now) return false;
      if (d.applies_to === 'shop') return true;
      if (d.applies_to === 'product' && d.product_id === product.id) return true;
      if (d.applies_to === 'category' && d.category_id === product.category_id) return true;
      return false;
    });

    if (relevantDiscounts.length === 0) return null;

    let bestPrice = basePrice;
    relevantDiscounts.forEach((discount: any) => {
      let discountedPrice = basePrice;
      
      if (discount.percentage) {
        discountedPrice = basePrice * (1 - discount.percentage / 100);
      }
      
      if (discount.fixed_amount) {
        discountedPrice = Math.max(discountedPrice - parseFloat(discount.fixed_amount), 0);
      }
      
      if (discountedPrice < bestPrice) {
        bestPrice = discountedPrice;
      }
    });

    return bestPrice === basePrice ? null : bestPrice;
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    let price = parseFloat(formData.get('price') as string);
    if (roundToNinetyNine) {
      price = Math.ceil(price) - 0.01;
    }

    const limitedStartDate = formData.get('limited_start_date') as string;
    const limitedEndDate = formData.get('limited_end_date') as string;

    // Get sound URL if uploaded
    const soundInput = document.getElementById('sound') as HTMLInputElement;
    const soundUrl = (soundInput as any)?.dataset?.soundUrl || editingProduct?.sound_url || null;
    const soundDuration = formData.get('sound_duration') as string;

    const productData = {
      name: formData.get('name') as string,
      category_id: formData.get('category_id') as string,
      price: price,
      description: formData.get('description') as string,
      details: formData.get('details') as string,
      active: formData.get('active') === 'true',
      coming_soon: formData.get('coming_soon') !== null,
      limited: formData.get('limited') !== null,
      is_new: formData.get('is_new') !== null,
      limited_start_date: limitedStartDate || null,
      limited_end_date: limitedEndDate || null,
      photo_display_count: parseInt(formData.get('photo_display_count') as string) || 1,
      sound_url: soundUrl,
      sound_duration: soundDuration ? parseInt(soundDuration) : null,
    };

    // Validate input
    try {
      productSchema.parse(productData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Validatiefout",
        description: error.errors?.[0]?.message || "Controleer de invoer",
      });
      return;
    }

    try {
      let productId = editingProduct?.id;
      
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      }

      // Upload images if any
      if (uploadingImages && uploadingImages.length > 0 && productId) {
        await handleImageUpload(productId, uploadingImages);
      }

      toast({
        title: "Opgeslagen!",
        description: `Product ${editingProduct ? 'bijgewerkt' : 'toegevoegd'}`,
      });
      setDialogOpen(false);
      setEditingProduct(null);
      setUploadingImages(null);
      setRoundToNinetyNine(false);
      loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: error.message,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit product wilt verwijderen?')) return;

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: error.message,
      });
    } else {
      toast({
        title: "Verwijderd",
        description: "Product verwijderd",
      });
      loadData();
    }
  };

  const handleImageUpload = async (productId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${productId}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        await supabase.from('product_images').insert({
          product_id: productId,
          image_url: publicUrl,
          display_order: i,
        });
      }

      toast({
        title: "Foto's geüpload",
        description: `${files.length} foto('s) toegevoegd`,
      });
      loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: error.message,
      });
    }
  };

  const handleImageDelete = async (imageId: string, imageUrl: string) => {
    try {
      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts.slice(-2).join('/');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove([fileName]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      toast({
        title: "Foto verwijderd",
      });
      loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: error.message,
      });
    }
  };

  const handleImageReorder = async (productId: string, images: any[], event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);

    const reorderedImages = arrayMove(images, oldIndex, newIndex);

    try {
      // Update display_order for all images
      for (let i = 0; i < reorderedImages.length; i++) {
        await supabase
          .from('product_images')
          .update({ display_order: i })
          .eq('id', reorderedImages[i].id);
      }

      toast({
        title: "Volgorde bijgewerkt",
      });
      loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: error.message,
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeTab === "all" || product.category_id === activeTab;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h3 className="text-xl font-semibold">Producten Beheer</h3>
        <div className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek producten..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingProduct(null);
            setUploadingImages(null);
            setRoundToNinetyNine(false);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Product Toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Product Bewerken' : 'Nieuw Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="name">Naam</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingProduct?.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category_id">Categorie</Label>
                <Select name="category_id" defaultValue={editingProduct?.category_id} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price">Prijs (€)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={editingProduct?.price}
                  required
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="roundPrice"
                    checked={roundToNinetyNine}
                    onCheckedChange={(checked) => setRoundToNinetyNine(checked as boolean)}
                  />
                  <label
                    htmlFor="roundPrice"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Prijs afronden naar €X,99
                  </label>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Korte Beschrijving</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingProduct?.description}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="details">Uitgebreide Beschrijving</Label>
                <Textarea
                  id="details"
                  name="details"
                  defaultValue={editingProduct?.details}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="active">Status</Label>
                <Select name="active" defaultValue={editingProduct?.active?.toString() || 'true'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Actief</SelectItem>
                    <SelectItem value="false">Inactief</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="coming_soon"
                  name="coming_soon"
                  defaultChecked={editingProduct?.coming_soon}
                />
                <Label htmlFor="coming_soon" className="font-normal">
                  Binnenkort beschikbaar
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="limited"
                  name="limited"
                  defaultChecked={editingProduct?.limited}
                />
                <Label htmlFor="limited" className="font-normal">
                  Limited Edition
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_new"
                  name="is_new"
                  defaultChecked={editingProduct?.is_new}
                />
                <Label htmlFor="is_new" className="font-normal">
                  Nieuw Product (komt bovenaan)
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="limited_start_date">Limited Start Datum</Label>
                  <Input
                    id="limited_start_date"
                    name="limited_start_date"
                    type="datetime-local"
                    defaultValue={editingProduct?.limited_start_date ? new Date(editingProduct.limited_start_date).toISOString().slice(0, 16) : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="limited_end_date">Limited Eind Datum</Label>
                  <Input
                    id="limited_end_date"
                    name="limited_end_date"
                    type="datetime-local"
                    defaultValue={editingProduct?.limited_end_date ? new Date(editingProduct.limited_end_date).toISOString().slice(0, 16) : ''}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="photo_display_count">Foto Weergave</Label>
                <Select name="photo_display_count" defaultValue={editingProduct?.photo_display_count?.toString() || '1'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 foto</SelectItem>
                    <SelectItem value="2">2 foto's (naast elkaar)</SelectItem>
                    <SelectItem value="3">3 foto's (1 groot, 2 klein)</SelectItem>
                    <SelectItem value="4">4 foto's (raster)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="images">Foto's toevoegen</Label>
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setUploadingImages(e.target.files)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {uploadingImages ? `${uploadingImages.length} foto('s) geselecteerd` : 'Selecteer één of meerdere foto\'s'}
                </p>
              </div>
              <div>
                <Label htmlFor="sound">Product Geluid (optioneel)</Label>
                <Input
                  id="sound"
                  type="file"
                  accept="audio/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    try {
                      const fileExt = file.name.split('.').pop();
                      const fileName = `sounds/${Math.random()}.${fileExt}`;
                      
                      const { error: uploadError } = await supabase.storage
                        .from('product-images')
                        .upload(fileName, file);
                      
                      if (uploadError) throw uploadError;
                      
                      const { data: { publicUrl } } = supabase.storage
                        .from('product-images')
                        .getPublicUrl(fileName);
                      
                      // Store the URL temporarily
                      (e.target as any).dataset.soundUrl = publicUrl;
                      
                      toast({
                        title: "Geluid geüpload",
                      });
                    } catch (error: any) {
                      toast({
                        variant: "destructive",
                        title: "Fout bij uploaden",
                        description: error.message,
                      });
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload een geluid dat speelt wanneer op dit product geklikt wordt
                </p>
              </div>
              <div>
                <Label htmlFor="sound_duration">Geluid Duur (seconden, optioneel)</Label>
                <Input
                  id="sound_duration"
                  name="sound_duration"
                  type="number"
                  min="1"
                  max="30"
                  defaultValue={editingProduct?.sound_duration || ''}
                  placeholder="Leeg = volledige lengte"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Hoeveel seconden het geluid moet afspelen (bijv. 3 voor 3 seconden)
                </p>
              </div>
              <Button type="submit" className="w-full">Opslaan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
          <TabsTrigger value="all">Alle Producten</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid gap-4">
            {filteredProducts.map((product) => (
          <div key={product.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{product.name}</h4>
                <p className="text-sm text-muted-foreground">{product.category?.label}</p>
                {(() => {
                  const discountedPrice = getDiscountedPrice(product);
                  const basePrice = parseFloat(product.price);
                  if (discountedPrice) {
                    return (
                      <div className="flex items-center gap-2">
                        <p className="text-muted-foreground line-through text-sm">€{basePrice.toFixed(2)}</p>
                        <p className="text-primary font-bold">€{discountedPrice.toFixed(2)}</p>
                        <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded">
                          -{((basePrice - discountedPrice) / basePrice * 100).toFixed(0)}%
                        </span>
                      </div>
                    );
                  }
                  return <p className="text-primary font-bold">€{basePrice.toFixed(2)}</p>;
                })()}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingProduct(product);
                    setDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor={`upload-${product.id}`}>
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Foto's Uploaden
                  </span>
                </Button>
              </Label>
              <input
                id={`upload-${product.id}`}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(product.id, e.target.files)}
              />
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleImageReorder(product.id, product.images || [], event)}
              >
                <SortableContext
                  items={product.images?.map((img: any) => img.id) || []}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {product.images?.map((img: any) => (
                      <SortableImage
                        key={img.id}
                        image={img}
                        onDelete={() => handleImageDelete(img.id, img.image_url)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
            </div>
          ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const SortableImage = ({ image, onDelete }: { image: any; onDelete: () => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing absolute top-1 left-1 bg-background/80 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-3 w-3" />
      </div>
      <img
        src={image.image_url}
        alt="Product"
        className="w-20 h-20 object-cover rounded"
      />
      <button
        type="button"
        onClick={onDelete}
        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};
