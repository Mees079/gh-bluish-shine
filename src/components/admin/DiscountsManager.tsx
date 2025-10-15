import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const DiscountsManager = () => {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    const { data } = await supabase
      .from('discounts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setDiscounts(data);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const discountData = {
      code: formData.get('code') as string,
      percentage: formData.get('percentage') ? parseInt(formData.get('percentage') as string) : null,
      fixed_amount: formData.get('fixed_amount') ? parseFloat(formData.get('fixed_amount') as string) : null,
      active: formData.get('active') === 'true',
    };

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
      loadDiscounts();
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
      toast({
        title: "Verwijderd",
        description: "Korting verwijderd",
      });
      loadDiscounts();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Kortingen Beheer</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingDiscount(null)}>
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
                <Label htmlFor="code">Kortingscode</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="bijv: ZOMER2025"
                  defaultValue={editingDiscount?.code}
                  required
                />
              </div>
              <div>
                <Label htmlFor="percentage">Percentage (%)</Label>
                <Input
                  id="percentage"
                  name="percentage"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="bijv: 10"
                  defaultValue={editingDiscount?.percentage}
                />
              </div>
              <div>
                <Label htmlFor="fixed_amount">Of Vast Bedrag (€)</Label>
                <Input
                  id="fixed_amount"
                  name="fixed_amount"
                  type="number"
                  step="0.01"
                  placeholder="bijv: 5.00"
                  defaultValue={editingDiscount?.fixed_amount}
                />
              </div>
              <div>
                <Label htmlFor="active">Status</Label>
                <select
                  id="active"
                  name="active"
                  defaultValue={editingDiscount?.active?.toString() || 'true'}
                  className="w-full p-2 border rounded"
                >
                  <option value="true">Actief</option>
                  <option value="false">Inactief</option>
                </select>
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
                {discount.percentage ? `${discount.percentage}% korting` : `€${discount.fixed_amount} korting`}
              </p>
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
