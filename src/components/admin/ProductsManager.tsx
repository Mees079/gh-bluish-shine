import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const ProductsManager = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

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
    
    const productData = {
      name: formData.get('name') as string,
      category_id: formData.get('category_id') as string,
      price: parseFloat(formData.get('price') as string),
      description: formData.get('description') as string,
      details: formData.get('details') as string,
      active: formData.get('active') === 'true',
    };

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);
        if (error) throw error;
      }

      toast({
        title: "Opgeslagen!",
        description: `Product ${editingProduct ? 'bijgewerkt' : 'toegevoegd'}`,
      });
      setDialogOpen(false);
      setEditingProduct(null);
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Producten Beheer</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProduct(null)}>
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
              <Button type="submit" className="w-full">Opslaan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
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
                  <img
                    key={img.id}
                    src={img.image_url}
                    alt="Product"
                    className="w-20 h-20 object-cover rounded"
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
