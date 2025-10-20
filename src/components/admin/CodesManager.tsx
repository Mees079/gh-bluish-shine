import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface Product {
  id: string;
  name: string;
  category_id: string;
}

interface RedemptionCode {
  id: string;
  code: string;
  created_at: string;
  claimed_at: string | null;
  claimed_by_username: string | null;
  active: boolean;
  products: { name: string }[];
}

export const CodesManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCodes, setActiveCodes] = useState<RedemptionCode[]>([]);
  const [claimedCodes, setClaimedCodes] = useState<RedemptionCode[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, category_id')
        .eq('active', true)
        .order('name');

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Load codes
      await loadCodes();
    } catch (error: any) {
      toast({
        title: "Fout bij laden",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCodes = async () => {
    try {
      const { data: codesData, error: codesError } = await supabase
        .from('redemption_codes')
        .select(`
          id,
          code,
          created_at,
          claimed_at,
          claimed_by_username,
          active,
          code_products (
            products (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (codesError) throw codesError;

      const formattedCodes = (codesData || []).map(code => ({
        ...code,
        products: code.code_products.map((cp: any) => ({ name: cp.products.name }))
      }));

      setActiveCodes(formattedCodes.filter(c => !c.claimed_at && c.active));
      setClaimedCodes(formattedCodes.filter(c => c.claimed_at));
    } catch (error: any) {
      toast({
        title: "Fout bij laden codes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [];
    for (let i = 0; i < 3; i++) {
      let segment = '';
      for (let j = 0; j < 4; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      segments.push(segment);
    }
    return segments.join('-');
  };

  const handleGenerateCode = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Selecteer producten",
        description: "Selecteer minimaal 1 product voor deze code",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const newCode = generateCode();

      // Insert code
      const { data: codeData, error: codeError } = await supabase
        .from('redemption_codes')
        .insert({
          code: newCode,
          active: true,
        })
        .select()
        .single();

      if (codeError) throw codeError;

      // Insert code_products relationships
      const codeProducts = selectedProducts.map(productId => ({
        code_id: codeData.id,
        product_id: productId,
      }));

      const { error: productsError } = await supabase
        .from('code_products')
        .insert(codeProducts);

      if (productsError) throw productsError;

      toast({
        title: "Code aangemaakt",
        description: `Code ${newCode} is succesvol aangemaakt`,
      });

      setSelectedProducts([]);
      await loadCodes();
    } catch (error: any) {
      toast({
        title: "Fout bij aanmaken code",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "Gekopieerd",
      description: "Code is gekopieerd naar klembord",
    });
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="create" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="create">Code Aanmaken</TabsTrigger>
        <TabsTrigger value="active">
          Actieve Codes <Badge variant="secondary" className="ml-2">{activeCodes.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="claimed">
          Geclaimde Codes <Badge variant="secondary" className="ml-2">{claimedCodes.length}</Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="create" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Nieuwe Code Aanmaken</CardTitle>
            <CardDescription>
              Selecteer de producten die je wilt toevoegen aan de code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {products.map((product) => (
                <div key={product.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={product.id}
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={() => toggleProductSelection(product.id)}
                  />
                  <Label
                    htmlFor={product.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {product.name}
                  </Label>
                </div>
              ))}
            </div>

            <Button
              onClick={handleGenerateCode}
              disabled={generating || selectedProducts.length === 0}
              className="w-full"
              variant="glow"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Code Genereren...
                </>
              ) : (
                "Code Genereren"
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="active" className="space-y-4">
        {activeCodes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Geen actieve codes beschikbaar
              </p>
            </CardContent>
          </Card>
        ) : (
          activeCodes.map((code) => (
            <Card key={code.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="text-lg font-mono font-bold">{code.code}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(code.code)}
                      >
                        {copiedCode === code.code ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Aangemaakt: {format(new Date(code.created_at), 'dd-MM-yyyy HH:mm')}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {code.products.map((product, idx) => (
                        <Badge key={idx} variant="outline">
                          {product.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>

      <TabsContent value="claimed" className="space-y-4">
        {claimedCodes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Geen geclaimde codes beschikbaar
              </p>
            </CardContent>
          </Card>
        ) : (
          claimedCodes.map((code) => (
            <Card key={code.id}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="text-lg font-mono font-bold text-muted-foreground line-through">
                      {code.code}
                    </code>
                    <Badge variant="secondary">Geclaimed</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Geclaimed door: <span className="font-medium">{code.claimed_by_username}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Geclaimed op: {format(new Date(code.claimed_at!), 'dd-MM-yyyy HH:mm')}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {code.products.map((product, idx) => (
                      <Badge key={idx} variant="outline">
                        {product.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
};