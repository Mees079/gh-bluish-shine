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
    const isActiveEffective = discountData.active && (!discountData.expires_at || new Date(discountData.expires_at as string) > new Date());

    // Apply or clear discount for whole shop
    if (applyTo === 'shop') {
      try {
        if (isActiveEffective) {
          const { data: allProducts } = await supabase.from('products').select('id, price');
          if (allProducts) {
            for (const prod of allProducts) {
              let discountedPrice;
              if (percentage != null) {
                discountedPrice = prod.price * (1 - percentage / 100);
              } else if (fixedAmount != null) {
                discountedPrice = Math.max(0, prod.price - fixedAmount);
              }
              if (discountedPrice !== undefined) {
                await supabase.from('products').update({ discounted_price: discountedPrice }).eq('id', prod.id);
              }
            }
          }
        } else {
          // Clear discounts when inactive or expired
          await supabase.from('products').update({ discounted_price: null }).neq('discounted_price', null);
        }
      } catch (error) {
        console.error('Error applying/clearing shop-wide discount:', error);
      }
    }

    // Apply or clear discount to category products
    if (applyTo === 'category' && discountData.category_id) {
      try {
        if (isActiveEffective) {
          const { data: categoryProducts } = await supabase
            .from('products')
            .select('id, price')
            .eq('category_id', discountData.category_id);
          
        if (categoryProducts) {
            for (const prod of categoryProducts) {
              let discountedPrice;
              if (percentage != null) {
                discountedPrice = prod.price * (1 - percentage / 100);
              } else if (fixedAmount != null) {
                discountedPrice = Math.max(0, prod.price - fixedAmount);
              }
              if (discountedPrice !== undefined) {
                await supabase.from('products').update({ discounted_price: discountedPrice }).eq('id', prod.id);
              }
            }
          }
        } else {
          await supabase.from('products').update({ discounted_price: null }).eq('category_id', discountData.category_id);
        }
      } catch (error) {
        console.error('Error applying/clearing category discount:', error);
      }
    }

    // Apply or clear discount to specific product
    if (applyTo === 'product' && discountData.product_id) {
      try {
        if (isActiveEffective) {
          const { data: product } = await supabase
            .from('products')
            .select('price')
            .eq('id', discountData.product_id)
            .maybeSingle();
          
          if (product) {
            let discountedPrice;
            if (percentage != null) {
              discountedPrice = product.price * (1 - percentage / 100);
            } else if (fixedAmount != null) {
              discountedPrice = Math.max(0, product.price - fixedAmount);
            }
            if (discountedPrice !== undefined) {
              await supabase.from('products').update({ discounted_price: discountedPrice }).eq('id', discountData.product_id);
            }
          }
        } else {
          await supabase.from('products').update({ discounted_price: null }).eq('id', discountData.product_id);
        }
      } catch (error) {
        console.error('Error applying/clearing product discount:', error);
      }
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

    // Find discount details locally to know the scope
    const d = discounts.find((x) => x.id === id);

    const { error } = await supabase.from('discounts').delete().eq('id', id);
    if (error) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: error.message,
      });
    } else {
      // Clear discounted prices for the affected scope
      try {
        if (d) {
          if (d.applies_to === 'shop') {
            await supabase.from('products').update({ discounted_price: null }).neq('discounted_price', null);
          } else if (d.applies_to === 'category' && d.category_id) {
            await supabase.from('products').update({ discounted_price: null }).eq('category_id', d.category_id);
          } else if (d.applies_to === 'product' && d.product_id) {
            await supabase.from('products').update({ discounted_price: null }).eq('id', d.product_id);
          }
        }

        // Re-apply any remaining active discounts
        const { data: remainingDiscounts } = await supabase
          .from('discounts')
          .select('*')
          .eq('active', true);

        if (remainingDiscounts) {
          const now = new Date();
          for (const discount of remainingDiscounts) {
            // Check if discount is not expired
            const isActive = !discount.expires_at || new Date(discount.expires_at) > now;
            if (!isActive) continue;

            if (discount.applies_to === 'shop') {
              const { data: allProducts } = await supabase.from('products').select('id, price');
              if (allProducts) {
                for (const prod of allProducts) {
                  let discountedPrice;
                  if (discount.percentage != null) {
                    discountedPrice = prod.price * (1 - discount.percentage / 100);
                  } else if (discount.fixed_amount != null) {
                    discountedPrice = Math.max(0, prod.price - discount.fixed_amount);
                  }
                  if (discountedPrice !== undefined) {
                    await supabase.from('products').update({ discounted_price: discountedPrice }).eq('id', prod.id);
                  }
                }
              }
            } else if (discount.applies_to === 'category' && discount.category_id) {
              const { data: categoryProducts } = await supabase
                .from('products')
                .select('id, price')
                .eq('category_id', discount.category_id);
              
              if (categoryProducts) {
                for (const prod of categoryProducts) {
                  let discountedPrice;
                  if (discount.percentage != null) {
                    discountedPrice = prod.price * (1 - discount.percentage / 100);
                  } else if (discount.fixed_amount != null) {
                    discountedPrice = Math.max(0, prod.price - discount.fixed_amount);
                  }
                  if (discountedPrice !== undefined) {
                    await supabase.from('products').update({ discounted_price: discountedPrice }).eq('id', prod.id);
                  }
                }
              }
            } else if (discount.applies_to === 'product' && discount.product_id) {
              const { data: product } = await supabase
                .from('products')
                .select('price')
                .eq('id', discount.product_id)
                .maybeSingle();
              
              if (product) {
                let discountedPrice;
                if (discount.percentage != null) {
                  discountedPrice = product.price * (1 - discount.percentage / 100);
                } else if (discount.fixed_amount != null) {
                  discountedPrice = Math.max(0, product.price - discount.fixed_amount);
                }
                if (discountedPrice !== undefined) {
                  await supabase.from('products').update({ discounted_price: discountedPrice }).eq('id', discount.product_id);
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Error clearing discounted prices after delete:', e);
      }

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
