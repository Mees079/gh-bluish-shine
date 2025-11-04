import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { discountSchema } from "@/lib/validation";

export const DiscountsManager = () => {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [applyTo, setApplyTo] = useState<string>('product');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    reapplyAllDiscounts();
  }, []);

  const loadData = async () => {
    const [discountsRes, productsRes, categoriesRes] = await Promise.all([
      supabase.from('discounts').select('*, product:products(name), category:categories(label)').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name'),
      supabase.from('categories').select('id, label')
    ]);
    
    if (discountsRes.data) setDiscounts(discountsRes.data);
    if (productsRes.data) setProducts(productsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
  };

  const reapplyAllDiscounts = async () => {
    // Reset alle kortingen
    await supabase.from('products').update({ discounted_price: null });

    // Haal alle actieve en niet-verlopen kortingen op
    const { data: discountsData } = await supabase
      .from('discounts')
      .select('applies_to, product_id, category_id, percentage, fixed_amount, expires_at, active')
      .eq('active', true);

    const now = new Date();
    const activeDiscounts = (discountsData || []).filter((d: any) => !d.expires_at || new Date(d.expires_at) > now);

    // Haal alle producten op
    const { data: productsData } = await supabase
      .from('products')
      .select('id, price, category_id');

    if (!productsData) return;

    for (const prod of productsData) {
      const base = Number(prod.price);
      let best = base;

      activeDiscounts.forEach((d: any) => {
        const applies = (
          d.applies_to === 'shop' ||
          (d.applies_to === 'category' && d.category_id === prod.category_id) ||
          (d.applies_to === 'product' && d.product_id === prod.id)
        );
        if (!applies) return;

        let discounted = base;
        if (d.percentage != null) {
          discounted = base * (1 - Number(d.percentage) / 100);
        }
        if (d.fixed_amount != null) {
          discounted = Math.max(discounted - Number(d.fixed_amount), 0);
        }
        if (discounted < best) best = discounted;
      });

      const newValue = best < base ? best : null;
      await supabase.from('products').update({ discounted_price: newValue }).eq('id', prod.id);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const percentage = formData.get('percentage') ? parseInt(formData.get('percentage') as string) : null;
    const fixedAmount = formData.get('fixed_amount') ? parseFloat(formData.get('fixed_amount') as string) : null;
    const expiresAt = formData.get('expires_at') ? formData.get('expires_at') as string : null;
    
    const discountData: any = {
      code: formData.get('code') as string,
      percentage: percentage,
      fixed_amount: fixedAmount,
      active: formData.get('active') === 'true',
      applies_to: applyTo,
      product_id: applyTo === 'product' ? (formData.get('product_id') as string || null) : null,
      category_id: applyTo === 'category' ? (formData.get('category_id') as string || null) : null,
      expires_at: expiresAt,
    };

    // Validate input
    try {
      discountSchema.parse(discountData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Validatiefout",
        description: error.errors?.[0]?.message || "Controleer de invoer",
      });
      return;
    }

    try {
      if (editingDiscount) {
        const { error } = await supabase
          .from('discounts')
          .update(discountData)
          .eq('id', editingDiscount.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('discounts')
          .insert(discountData);
        if (error) throw error;
      }

      // Reapply all discounts after save
      await reapplyAllDiscounts();

      toast({
        title: "Opgeslagen!",
        description: `Korting ${editingDiscount ? 'bijgewerkt' : 'toegevoegd'}`,
      });
      setDialogOpen(false);
      setEditingDiscount(null);
      setApplyTo('product');
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
    if (!confirm('Weet je zeker dat je deze korting wilt verwijderen?')) return;

    const { error } = await supabase.from('discounts').delete().eq('id', id);
    if (error) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: error.message,
      });
    } else {
      // Reapply all remaining discounts after delete
      await reapplyAllDiscounts();

      toast({
        title: "Verwijderd",
        description: "Korting verwijderd",
      });
      loadData();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Kortingen Beheer</h3>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingDiscount(null);
            setApplyTo('product');
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Korting Toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDiscount ? 'Korting Bewerken' : 'Nieuwe Korting'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="code">Kortingsnaam</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="bijv: Zomerkorting 2025"
                  defaultValue={editingDiscount?.code}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alleen voor intern gebruik, niet zichtbaar voor klanten
                </p>
              </div>
              <div>
                <Label htmlFor="applies_to">Toepassen op</Label>
                <Select value={applyTo} onValueChange={setApplyTo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shop">Hele Shop</SelectItem>
                    <SelectItem value="category">Categorie</SelectItem>
                    <SelectItem value="product">Specifiek Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {applyTo === 'product' && (
                <div>
                  <Label htmlFor="product_id">Product</Label>
                  <Select name="product_id" defaultValue={editingDiscount?.product_id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((prod) => (
                        <SelectItem key={prod.id} value={prod.id}>
                          {prod.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {applyTo === 'category' && (
                <div>
                  <Label htmlFor="category_id">Categorie</Label>
                  <Select name="category_id" defaultValue={editingDiscount?.category_id}>
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
              )}
              <div>
                <Label htmlFor="percentage">Kortingspercentage (%)</Label>
                <Input
                  id="percentage"
                  name="percentage"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="bijv: 20"
                  defaultValue={editingDiscount?.percentage}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Laat leeg voor vast bedrag korting
                </p>
              </div>
              <div>
                <Label htmlFor="fixed_amount">Vast bedrag korting (€)</Label>
                <Input
                  id="fixed_amount"
                  name="fixed_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="bijv: 50.00"
                  defaultValue={editingDiscount?.fixed_amount}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Laat leeg voor percentage korting
                </p>
              </div>
              <div>
                <Label htmlFor="expires_at">Vervaldatum (optioneel)</Label>
                <Input
                  id="expires_at"
                  name="expires_at"
                  type="datetime-local"
                  defaultValue={editingDiscount?.expires_at ? new Date(editingDiscount.expires_at).toISOString().slice(0, 16) : ''}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Laat leeg voor onbeperkte duur
                </p>
              </div>
              <div>
                <Label htmlFor="active">Status</Label>
                <Select name="active" defaultValue={editingDiscount?.active?.toString() || 'true'}>
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
        {discounts.map((discount) => (
          <div key={discount.id} className="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <h4 className="font-semibold">{discount.code}</h4>
              <p className="text-sm text-muted-foreground">
                {discount.percentage && `${discount.percentage}% korting`}
                {discount.fixed_amount && `€${discount.fixed_amount} korting`}
              </p>
              <p className="text-sm text-muted-foreground">
                Toepassen op: {
                  discount.applies_to === 'shop' ? 'Hele Shop' :
                  discount.applies_to === 'category' ? `Categorie: ${discount.category?.label || 'Onbekend'}` :
                  `Product: ${discount.product?.name || 'Onbekend'}`
                }
              </p>
              {discount.expires_at && (
                <p className="text-sm text-muted-foreground">
                  Verloopt: {new Date(discount.expires_at).toLocaleString('nl-NL')}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Status: {discount.active ? 'Actief' : 'Inactief'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingDiscount(discount);
                  setApplyTo(discount.applies_to || 'product');
                  setDialogOpen(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(discount.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
