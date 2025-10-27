import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, TrendingUp, Euro, Package, Users, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon } from "lucide-react";
import { format, parseISO, startOfDay } from "date-fns";
import { nl } from "date-fns/locale";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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

interface ChartData {
  dailyRevenue: Array<{ date: string; revenue: number; claims: number }>;
  topProducts: Array<{ name: string; count: number; revenue: number }>;
  userStats: Array<{ username: string; total: number }>;
}

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

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
  const [chartData, setChartData] = useState<ChartData>({
    dailyRevenue: [],
    topProducts: [],
    userStats: [],
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

      // Calculate chart data
      calculateChartData(claimsData);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateChartData = (claimsData: CodeClaim[]) => {
    // Daily revenue
    const dailyMap = new Map<string, { revenue: number; claims: number }>();
    claimsData.forEach(claim => {
      const date = format(startOfDay(parseISO(claim.claimed_at)), 'dd MMM');
      const existing = dailyMap.get(date) || { revenue: 0, claims: 0 };
      dailyMap.set(date, {
        revenue: existing.revenue + parseFloat(claim.final_amount.toString()),
        claims: existing.claims + 1
      });
    });
    const dailyRevenue = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top products
    const productMap = new Map<string, { count: number; revenue: number }>();
    claimsData.forEach(claim => {
      claim.products_data.forEach((product: any) => {
        const existing = productMap.get(product.name) || { count: 0, revenue: 0 };
        productMap.set(product.name, {
          count: existing.count + 1,
          revenue: existing.revenue + parseFloat(product.final_price)
        });
      });
    });
    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    // User stats
    const userMap = new Map<string, number>();
    claimsData.forEach(claim => {
      const existing = userMap.get(claim.claimed_by_username) || 0;
      userMap.set(claim.claimed_by_username, existing + parseFloat(claim.final_amount.toString()));
    });
    const userStats = Array.from(userMap.entries())
      .map(([username, total]) => ({ username, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    setChartData({ dailyRevenue, topProducts, userStats });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">📊 Statistieken</h2>
          <p className="text-muted-foreground">Bekijk al je verkoop en claim data</p>
        </div>
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold">📅 Periode Filter</h3>
              <p className="text-sm text-muted-foreground">Selecteer de periode</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge 
                variant={dateFilter === 'all' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setDateFilter('all')}
              >
                Alles
              </Badge>
              <Badge 
                variant={dateFilter === 'today' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setDateFilter('today')}
              >
                Vandaag
              </Badge>
              <Badge 
                variant={dateFilter === 'week' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setDateFilter('week')}
              >
                Laatste 7 dagen
              </Badge>
              <Badge 
                variant={dateFilter === 'month' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setDateFilter('month')}
              >
                Laatste 30 dagen
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5" />
                📈 Omzet Per Dag
              </CardTitle>
              <CardDescription>Dagelijkse omzet en aantal claims</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} name="Omzet (€)" />
                  <Line yAxisId="right" type="monotone" dataKey="claims" stroke="#ec4899" strokeWidth={2} name="Aantal Claims" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                📦 Top 6 Producten
              </CardTitle>
              <CardDescription>Meest verkochte producten (omzet)</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8b5cf6" name="Omzet (€)" />
                  <Bar dataKey="count" fill="#ec4899" name="Aantal Verkocht" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              👥 Top 10 Gebruikers (Omzet)
            </CardTitle>
            <CardDescription>Gebruikers met de hoogste totale omzet</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={chartData.userStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ username, total }) => `${username}: ${formatCurrency(total)}`}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {chartData.userStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Tables */}
        <Tabs defaultValue="claims" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="claims">📋 Alle Claims</TabsTrigger>
            <TabsTrigger value="products">📦 Producten Details</TabsTrigger>
            <TabsTrigger value="users">👤 Gebruikers</TabsTrigger>
          </TabsList>

        <TabsContent value="claims" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Claims Overzicht</CardTitle>
              <CardDescription>Alle geclaime codes met financiële details</CardDescription>
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

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Producten Details</CardTitle>
              <CardDescription>Overzicht van alle geleverde producten</CardDescription>
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

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gebruikers Overzicht</CardTitle>
              <CardDescription>Statistieken per gebruiker</CardDescription>
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