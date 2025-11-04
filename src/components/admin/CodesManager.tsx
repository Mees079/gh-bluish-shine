import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check, Trash2, Calendar, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Category {
  id: string;
  name: string;
  label: string;
}

interface Product {
  id: string;
  name: string;
  category_id: string;
  price: number;
  discounted_price: number | null;
}

interface RedemptionCode {
  id: string;
  code: string;
  created_at: string;
  claimed_at: string | null;
  claimed_by_username: string | null;
  active: boolean;
  scheduled_start: string;
  created_by: string | null;
  creator_email?: string | undefined;
  is_test_code: boolean;
  products: { name: string }[];
}

export const CodesManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCodes, setActiveCodes] = useState<RedemptionCode[]>([]);
  const [claimedCodes, setClaimedCodes] = useState<RedemptionCode[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [scheduledStart, setScheduledStart] = useState<string>("");
  const [isTestCode, setIsTestCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, label')
        .order('display_order');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, category_id, price, discounted_price')
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
          scheduled_start,
          created_by,
          is_test_code,
          code_products (
            products (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (codesError) throw codesError;

      // Get creator emails
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const userEmails = new Map<string, string>();
      if (usersData?.users) {
        usersData.users.forEach((u: any) => {
          if (u.id && u.email) {
            userEmails.set(u.id, u.email);
          }
        });
      }

      const formattedCodes = (codesData || []).map(code => ({
        ...code,
        creator_email: code.created_by ? (userEmails.get(code.created_by) || undefined) : undefined,
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
      const { data: { user } } = await supabase.auth.getUser();

      // Prepare scheduled start time
      const startTime = scheduledStart 
        ? new Date(scheduledStart).toISOString() 
        : new Date().toISOString();

      // Insert code
      const { data: codeData, error: codeError } = await supabase
        .from('redemption_codes')
        .insert({
          code: newCode,
          active: true,
          scheduled_start: startTime,
          created_by: user?.id,
          is_test_code: isTestCode,
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

      const scheduleMsg = scheduledStart 
        ? ` Actief vanaf ${format(new Date(scheduledStart), 'dd-MM-yyyy HH:mm')}`
        : '';

      const testMsg = isTestCode ? ' (Test Code - telt niet mee in statistieken)' : '';
      toast({
        title: "Code aangemaakt",
        description: `Code ${newCode} is succesvol aangemaakt.${scheduleMsg}${testMsg}`,
      });

      setSelectedProducts([]);
      setScheduledStart("");
      setIsTestCode(false);
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

  const handleDeleteCode = async () => {
    if (!codeToDelete) return;

    try {
      const { error } = await supabase
        .from('redemption_codes')
        .delete()
        .eq('id', codeToDelete);

      if (error) throw error;

      toast({
        title: "Code verwijderd",
        description: "De code is succesvol verwijderd",
      });

      await loadCodes();
    } catch (error: any) {
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCodeToDelete(null);
    }
  };

  const confirmDelete = (codeId: string) => {
    setCodeToDelete(codeId);
    setDeleteDialogOpen(true);
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

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate price breakdown
  const calculatePriceBreakdown = () => {
    const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
    
    let totalOriginalPrice = 0;
    let totalDiscountedPrice = 0;
    
    selectedProductsData.forEach(product => {
      totalOriginalPrice += Number(product.price);
      totalDiscountedPrice += Number(product.discounted_price || product.price);
    });
    
    const totalDiscount = totalOriginalPrice - totalDiscountedPrice;
    const hasDiscount = totalDiscount > 0;
    
    return {
      totalOriginalPrice,
      totalDiscountedPrice,
      totalDiscount,
      hasDiscount
    };
  };

  const priceBreakdown = calculatePriceBreakdown();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
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
              Selecteer de producten en optioneel een starttijd
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Zoek Product</Label>
              <Input
                type="text"
                placeholder="Zoek producten..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Categorieën</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                >
                  Alle
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    type="button"
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Producten ({filteredProducts.length})</Label>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                {filteredProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Geen producten gevonden</p>
                ) : (
                  filteredProducts.map((product) => (
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
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled-start" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Starttijd (optioneel)
              </Label>
              <Input
                id="scheduled-start"
                type="datetime-local"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Laat leeg voor direct actief. Code is pas claimbaar na deze datum/tijd.
              </p>
            </div>

            {selectedProducts.length > 0 && (
              <Card className="bg-muted/30">
                <CardContent className="pt-6 space-y-2">
                  <h3 className="font-semibold text-sm">Prijs Overzicht</h3>
                  {priceBreakdown.hasDiscount ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Originele Prijs:</span>
                        <span className="line-through">€{priceBreakdown.totalOriginalPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Korting:</span>
                        <span>-€{priceBreakdown.totalDiscount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Totaal:</span>
                        <span>€{priceBreakdown.totalDiscountedPrice.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-lg font-bold">
                      <span>Totaal:</span>
                      <span>€{priceBreakdown.totalOriginalPrice.toFixed(2)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex items-center space-x-2 p-4 rounded-lg bg-muted/50 border">
              <Checkbox
                id="test-code"
                checked={isTestCode}
                onCheckedChange={(checked) => setIsTestCode(checked === true)}
              />
              <Label
                htmlFor="test-code"
                className="text-sm font-medium cursor-pointer flex-1"
              >
                Test Code (telt niet mee in statistieken)
              </Label>
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
          activeCodes.map((code) => {
            const isScheduled = new Date(code.scheduled_start) > new Date();
            return (
              <Card key={code.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
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
                        {code.is_test_code && (
                          <Badge variant="outline" className="border-orange-500 text-orange-500">
                            Test
                          </Badge>
                        )}
                        {isScheduled && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Gepland
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          Aangemaakt door: {code.creator_email || 'Onbekend'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          Aangemaakt: {format(new Date(code.created_at), 'dd-MM-yyyy HH:mm')}
                        </div>
                        {isScheduled && (
                          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                            <Clock className="h-3 w-3" />
                            Actief vanaf: {format(new Date(code.scheduled_start), 'dd-MM-yyyy HH:mm')}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {code.products.map((product, idx) => (
                          <Badge key={idx} variant="outline">
                            {product.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDelete(code.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-lg font-mono font-bold text-muted-foreground line-through">
                      {code.code}
                    </code>
                    <Badge variant="secondary">Geclaimed</Badge>
                    {code.is_test_code && (
                      <Badge variant="outline" className="border-orange-500 text-orange-500">
                        Test
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      Aangemaakt door: {code.creator_email || 'Onbekend'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Aangemaakt: {format(new Date(code.created_at), 'dd-MM-yyyy HH:mm')}
                    </div>
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <User className="h-3 w-3" />
                      Geclaimed door: <span className="font-medium">{code.claimed_by_username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Geclaimed op: {format(new Date(code.claimed_at!), 'dd-MM-yyyy HH:mm')}
                    </div>
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

    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Code Verwijderen</AlertDialogTitle>
          <AlertDialogDescription>
            Weet je zeker dat je deze code wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuleren</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteCode} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Verwijderen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};