import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { ProductsManager } from "./ProductsManager";
import { CategoriesManager } from "./CategoriesManagerDnd";
import { DiscountsManager } from "./DiscountsManager";
import { AccountManager } from "./AccountManager";
import { CodesManager } from "./CodesManager";

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export const AdminDashboard = ({ user, onLogout }: AdminDashboardProps) => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Admin Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Ingelogd als {user.email?.split('@')[0]}
          </p>
        </div>
        <Button variant="outline" onClick={onLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Uitloggen
        </Button>
      </div>

      <Tabs defaultValue="codes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="codes">Codes</TabsTrigger>
          <TabsTrigger value="site">Site Bewerken</TabsTrigger>
        </TabsList>

        <TabsContent value="codes" className="mt-6">
          <CodesManager />
        </TabsContent>

        <TabsContent value="site" className="mt-6">
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="products">Producten</TabsTrigger>
              <TabsTrigger value="categories">Categorieën</TabsTrigger>
              <TabsTrigger value="discounts">Kortingen</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-6">
              <ProductsManager />
            </TabsContent>

            <TabsContent value="categories" className="mt-6">
              <CategoriesManager />
            </TabsContent>

            <TabsContent value="discounts" className="mt-6">
              <DiscountsManager />
            </TabsContent>

            <TabsContent value="account" className="mt-6">
              <AccountManager user={user} />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};
