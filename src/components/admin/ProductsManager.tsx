import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Upload, X, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productSchema } from "@/lib/validation";

export const ProductsManager = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
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
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from('products').select('*, category:categories(*), images:product_images(*)').order('display_order'),
      supabase.from('categories').select('*').order('display_order')
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    let price = parseFloat(formData.get('price') as string);
    if (roundToNinetyNine) {
      price = Math.ceil(price) - 0.01;
    }

    const productData = {
      name: formData.get('name') as string,
      category_id: formData.get('category_id') as string,
      price: price,
      description: formData.get('description') as string,
      details: formData.get('details') as string,
      active: formData.get('active') === 'true',
      coming_soon: formData.get('coming_soon') !== null,
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
                <p className="text-primary font-bold">€{product.price}</p>
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
              <div className="flex gap-2 mt-2 flex-wrap">
                {product.images?.map((img: any) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.image_url}
                      alt="Product"
                      className="w-20 h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageDelete(img.id, img.image_url)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            </div>
          ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
