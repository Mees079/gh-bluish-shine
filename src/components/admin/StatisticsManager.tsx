import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, TrendingUp, Euro, Package, Users, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface CodeClaim {
  id: string;
  code: string;
  claimed_by_username: string;
  claimed_at: string;
  total_amount: number;
  total_discount: number;
  final_amount: number;
  products_data: any[];
  is_test_claim: boolean;
}

interface Statistics {
  totalRevenue: number;
  totalDiscount: number;
  totalClaims: number;
  uniqueUsers: number;
  averageOrderValue: number;
  totalProducts: number;
}

export const StatisticsManager = () => {
  const [claims, setClaims] = useState<CodeClaim[]>([]);
  const [stats, setStats] = useState<Statistics>({
    totalRevenue: 0,
    totalDiscount: 0,
    totalClaims: 0,
    uniqueUsers: 0,
    averageOrderValue: 0,
    totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('code_claims')
        .select('*')
        .eq('is_test_claim', false)
        .order('claimed_at', { ascending: false });

      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        if (dateFilter === 'today') {
          startDate.setHours(0, 0, 0, 0);
        } else if (dateFilter === 'week') {
          startDate.setDate(now.getDate() - 7);
        } else if (dateFilter === 'month') {
          startDate.setMonth(now.getMonth() - 1);
        }
        
        query = query.gte('claimed_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const claimsData = data as CodeClaim[];
      setClaims(claimsData);

      // Calculate statistics
      const totalRevenue = claimsData.reduce((sum, claim) => sum + parseFloat(claim.final_amount.toString()), 0);
      const totalDiscount = claimsData.reduce((sum, claim) => sum + parseFloat(claim.total_discount.toString()), 0);
      const uniqueUsers = new Set(claimsData.map(claim => claim.claimed_by_username)).size;
      const totalProducts = claimsData.reduce((sum, claim) => sum + claim.products_data.length, 0);

      setStats({
        totalRevenue,
        totalDiscount,
        totalClaims: claimsData.length,
        uniqueUsers,
        averageOrderValue: claimsData.length > 0 ? totalRevenue / claimsData.length : 0,
        totalProducts,
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2).replace('.', ',')}`;
  };

  const StatCard = ({ title, value, icon: Icon, description }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="flex justify-center p-8">Laden...</div>;
  }

  return (
    <div className="min-h-screen space-y-8 pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4">
        <h2 className="text-4xl font-bold tracking-tight">Statistieken Dashboard</h2>
        <p className="text-lg text-muted-foreground">Compleet overzicht van je verkopen en claims</p>
      </div>

      {/* Date Filter */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Periode Filter</h3>
              <p className="text-sm text-muted-foreground">Selecteer de periode die je wilt bekijken</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge 
                variant={dateFilter === 'all' ? 'default' : 'outline'} 
                className="cursor-pointer text-base py-2 px-4"
                onClick={() => setDateFilter('all')}
              >
                Alles
              </Badge>
              <Badge 
                variant={dateFilter === 'today' ? 'default' : 'outline'} 
                className="cursor-pointer text-base py-2 px-4"
                onClick={() => setDateFilter('today')}
              >
                Vandaag
              </Badge>
              <Badge 
                variant={dateFilter === 'week' ? 'default' : 'outline'} 
                className="cursor-pointer text-base py-2 px-4"
                onClick={() => setDateFilter('week')}
              >
                Laatste 7 dagen
              </Badge>
              <Badge 
                variant={dateFilter === 'month' ? 'default' : 'outline'} 
                className="cursor-pointer text-base py-2 px-4"
                onClick={() => setDateFilter('month')}
              >
                Laatste 30 dagen
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="💰 Totale Omzet"
          value={formatCurrency(stats.totalRevenue)}
          icon={Euro}
          description="Totaal verdiend bedrag (na korting)"
        />
        <StatCard
          title="🎁 Totale Korting Gegeven"
          value={formatCurrency(stats.totalDiscount)}
          icon={TrendingUp}
          description="Totaal bedrag aan korting"
        />
        <StatCard
          title="📊 Aantal Claims"
          value={stats.totalClaims}
          icon={BarChart3}
          description="Totaal aantal geclaime codes"
        />
        <StatCard
          title="👥 Unieke Gebruikers"
          value={stats.uniqueUsers}
          icon={Users}
          description="Aantal verschillende gebruikers"
        />
        <StatCard
          title="📈 Gemiddelde Orderwaarde"
          value={formatCurrency(stats.averageOrderValue)}
          icon={TrendingUp}
          description="Gemiddelde waarde per claim"
        />
        <StatCard
          title="📦 Totaal Producten"
          value={stats.totalProducts}
          icon={Package}
          description="Totaal aantal geleverde producten"
        />
      </div>

      {/* Detailed Tables */}
      <Tabs defaultValue="claims" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="claims" className="text-base">📋 Alle Claims</TabsTrigger>
          <TabsTrigger value="products" className="text-base">📦 Producten Details</TabsTrigger>
          <TabsTrigger value="users" className="text-base">👤 Gebruikers</TabsTrigger>
        </TabsList>

        <TabsContent value="claims" className="space-y-4 mt-6">
          <Card className="border-2">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-2xl">Claims Overzicht</CardTitle>
              <CardDescription className="text-base">Alle geclaime codes met financiële details</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Gebruiker</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Producten</TableHead>
                    <TableHead className="text-right">Origineel</TableHead>
                    <TableHead className="text-right">Korting</TableHead>
                    <TableHead className="text-right">Totaal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-mono">{claim.code}</TableCell>
                      <TableCell>{claim.claimed_by_username}</TableCell>
                      <TableCell>
                        {format(new Date(claim.claimed_at), 'dd MMM yyyy HH:mm', { locale: nl })}
                      </TableCell>
                      <TableCell>{claim.products_data.length}x</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(parseFloat(claim.total_amount.toString()))}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        -{formatCurrency(parseFloat(claim.total_discount.toString()))}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(parseFloat(claim.final_amount.toString()))}
                      </TableCell>
                    </TableRow>
                  ))}
                  {claims.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Nog geen claims in deze periode
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4 mt-6">
          <Card className="border-2">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-2xl">Producten Details</CardTitle>
              <CardDescription className="text-base">Overzicht van alle geleverde producten</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Gebruiker</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead className="text-right">Prijs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.flatMap((claim) =>
                    claim.products_data.map((product, idx) => (
                      <TableRow key={`${claim.id}-${idx}`}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell className="font-mono">{claim.code}</TableCell>
                        <TableCell>{claim.claimed_by_username}</TableCell>
                        <TableCell>
                          {format(new Date(claim.claimed_at), 'dd MMM yyyy', { locale: nl })}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.final_price !== product.original_price && (
                            <span className="line-through text-muted-foreground mr-2">
                              {formatCurrency(product.original_price)}
                            </span>
                          )}
                          {formatCurrency(product.final_price)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {claims.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nog geen producten geleverd in deze periode
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4 mt-6">
          <Card className="border-2">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-2xl">Gebruikers Overzicht</CardTitle>
              <CardDescription className="text-base">Statistieken per gebruiker</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gebruiker</TableHead>
                    <TableHead className="text-right">Aantal Claims</TableHead>
                    <TableHead className="text-right">Totaal Besteed</TableHead>
                    <TableHead className="text-right">Korting Ontvangen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from(new Set(claims.map(c => c.claimed_by_username))).map((username) => {
                    const userClaims = claims.filter(c => c.claimed_by_username === username);
                    const totalSpent = userClaims.reduce((sum, c) => sum + parseFloat(c.final_amount.toString()), 0);
                    const totalDiscount = userClaims.reduce((sum, c) => sum + parseFloat(c.total_discount.toString()), 0);
                    
                    return (
                      <TableRow key={username}>
                        <TableCell className="font-medium">{username}</TableCell>
                        <TableCell className="text-right">{userClaims.length}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalSpent)}</TableCell>
                        <TableCell className="text-right text-destructive">
                          -{formatCurrency(totalDiscount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {claims.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nog geen gebruikers in deze periode
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};