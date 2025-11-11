import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const HomeManager = () => {
  const [config, setConfig] = useState({
    id: "",
    banner_image_url: "",
    banner_title: "",
    banner_subtitle: "",
    discord_link: "",
    rules_content: "",
    show_banner: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data, error } = await supabase
      .from('home_config')
      .select('*')
      .single();
    
    if (error) {
      toast.error("Fout bij laden configuratie");
      return;
    }

    if (data) {
      setConfig({
        id: data.id,
        banner_image_url: data.banner_image_url || "",
        banner_title: data.banner_title || "",
        banner_subtitle: data.banner_subtitle || "",
        discord_link: data.discord_link || "",
        rules_content: data.rules_content || "",
        show_banner: data.show_banner ?? true,
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    
    const { error } = await supabase
      .from('home_config')
      .update({
        banner_image_url: config.banner_image_url || null,
        banner_title: config.banner_title,
        banner_subtitle: config.banner_subtitle || null,
        discord_link: config.discord_link || null,
        rules_content: config.rules_content || null,
        show_banner: config.show_banner,
      })
      .eq('id', config.id);

    setLoading(false);

    if (error) {
      toast.error("Fout bij opslaan");
      return;
    }

    toast.success("Instellingen opgeslagen");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Banner Instellingen</CardTitle>
          <CardDescription>Configureer de homepage banner</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.show_banner}
              onCheckedChange={(checked) => setConfig({ ...config, show_banner: checked })}
            />
            <Label>Banner tonen</Label>
          </div>

          <div className="space-y-2">
            <Label>Banner Titel</Label>
            <Input
              value={config.banner_title}
              onChange={(e) => setConfig({ ...config, banner_title: e.target.value })}
              placeholder="Welkom bij onze Shop"
            />
          </div>

          <div className="space-y-2">
            <Label>Banner Ondertitel</Label>
            <Input
              value={config.banner_subtitle}
              onChange={(e) => setConfig({ ...config, banner_subtitle: e.target.value })}
              placeholder="Ontdek onze exclusieve producten"
            />
          </div>

          <div className="space-y-2">
            <Label>Banner Afbeelding URL</Label>
            <Input
              value={config.banner_image_url}
              onChange={(e) => setConfig({ ...config, banner_image_url: e.target.value })}
              placeholder="https://example.com/banner.jpg"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
          <CardDescription>Configureer externe links</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Discord Link</Label>
            <Input
              value={config.discord_link}
              onChange={(e) => setConfig({ ...config, discord_link: e.target.value })}
              placeholder="https://discord.gg/yourserver"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regels</CardTitle>
          <CardDescription>Beheer de regels pagina (Markdown ondersteund)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Regels Inhoud</Label>
            <Textarea
              value={config.rules_content}
              onChange={(e) => setConfig({ ...config, rules_content: e.target.value })}
              placeholder="## Regels&#10;&#10;1. Respecteer anderen&#10;2. Geen spam"
              rows={12}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={loading} className="w-full">
        {loading ? "Opslaan..." : "Opslaan"}
      </Button>
    </div>
  );
};
