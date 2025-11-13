import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StatsManager } from "./StatsManager";

interface GalleryImage {
  id: string;
  image_url: string;
  title: string | null;
  display_order: number;
}

const SortableGalleryItem = ({ image, onDelete }: { image: GalleryImage; onDelete: (id: string) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <img src={image.image_url} alt={image.title || ''} className="w-20 h-20 object-cover rounded" />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{image.title || 'Geen titel'}</p>
        <p className="text-xs text-muted-foreground truncate">{image.image_url}</p>
      </div>
      <Button
        variant="destructive"
        size="icon"
        onClick={() => onDelete(image.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const HomeManager = () => {
  const [config, setConfig] = useState({
    id: "",
    hero_image_url: "",
    hero_title: "",
    hero_subtitle: "",
    hero_cta_text: "",
    hero_cta_link: "",
    roblox_link: "",
    about_title: "",
    about_content: "",
    about_image_url: "",
    features_title: "",
    feature_1_title: "",
    feature_1_description: "",
    feature_1_icon: "",
    feature_2_title: "",
    feature_2_description: "",
    feature_2_icon: "",
    feature_3_title: "",
    feature_3_description: "",
    feature_3_icon: "",
    gallery_title: "",
    show_gallery: true,
    cta_section_title: "",
    cta_section_description: "",
    cta_button_text: "",
    discord_link: "",
    rules_content: "",
    rules_page_title: "",
    rules_page_subtitle: "",
    rules_warning_title: "",
    rules_warning_text: "",
    rules_footer_text: "",
    show_about_section: true,
    show_features_section: true,
    show_cta_section: true,
  });
  const [loading, setLoading] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [newGalleryImage, setNewGalleryImage] = useState({ url: "", title: "" });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadConfig();
    loadGallery();
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
        hero_image_url: data.hero_image_url || "",
        hero_title: data.hero_title || "",
        hero_subtitle: data.hero_subtitle || "",
        hero_cta_text: data.hero_cta_text || "",
        hero_cta_link: data.hero_cta_link || "",
        roblox_link: data.roblox_link || "",
        about_title: data.about_title || "",
        about_content: data.about_content || "",
        about_image_url: data.about_image_url || "",
        features_title: data.features_title || "",
        feature_1_title: data.feature_1_title || "",
        feature_1_description: data.feature_1_description || "",
        feature_1_icon: data.feature_1_icon || "",
        feature_2_title: data.feature_2_title || "",
        feature_2_description: data.feature_2_description || "",
        feature_2_icon: data.feature_2_icon || "",
        feature_3_title: data.feature_3_title || "",
        feature_3_description: data.feature_3_description || "",
        feature_3_icon: data.feature_3_icon || "",
        gallery_title: data.gallery_title || "",
        show_gallery: data.show_gallery ?? true,
        cta_section_title: data.cta_section_title || "",
        cta_section_description: data.cta_section_description || "",
        cta_button_text: data.cta_button_text || "",
        discord_link: data.discord_link || "",
        rules_content: data.rules_content || "",
        rules_page_title: data.rules_page_title || "",
        rules_page_subtitle: data.rules_page_subtitle || "",
        rules_warning_title: data.rules_warning_title || "",
        rules_warning_text: data.rules_warning_text || "",
        rules_footer_text: data.rules_footer_text || "",
        show_about_section: data.show_about_section ?? true,
        show_features_section: data.show_features_section ?? true,
        show_cta_section: data.show_cta_section ?? true,
      });
    }
  };

  const loadGallery = async () => {
    const { data } = await supabase
      .from('gallery_images')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (data) {
      setGalleryImages(data);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    
    const { error } = await supabase
      .from('home_config')
      .update({
        hero_image_url: config.hero_image_url || null,
        hero_title: config.hero_title,
        hero_subtitle: config.hero_subtitle || null,
        hero_cta_text: config.hero_cta_text || null,
        hero_cta_link: config.hero_cta_link || null,
        roblox_link: config.roblox_link || null,
        about_title: config.about_title,
        about_content: config.about_content || null,
        about_image_url: config.about_image_url || null,
        features_title: config.features_title,
        feature_1_title: config.feature_1_title,
        feature_1_description: config.feature_1_description,
        feature_1_icon: config.feature_1_icon,
        feature_2_title: config.feature_2_title,
        feature_2_description: config.feature_2_description,
        feature_2_icon: config.feature_2_icon,
        feature_3_title: config.feature_3_title,
        feature_3_description: config.feature_3_description,
        feature_3_icon: config.feature_3_icon,
        gallery_title: config.gallery_title,
        show_gallery: config.show_gallery,
        cta_section_title: config.cta_section_title,
        cta_section_description: config.cta_section_description,
        cta_button_text: config.cta_button_text,
        discord_link: config.discord_link || null,
        rules_content: config.rules_content || null,
        rules_page_title: config.rules_page_title || null,
        rules_page_subtitle: config.rules_page_subtitle || null,
        rules_warning_title: config.rules_warning_title || null,
        rules_warning_text: config.rules_warning_text || null,
        rules_footer_text: config.rules_footer_text || null,
        show_about_section: config.show_about_section,
        show_features_section: config.show_features_section,
        show_cta_section: config.show_cta_section,
      })
      .eq('id', config.id);

    setLoading(false);

    if (error) {
      toast.error("Fout bij opslaan");
      return;
    }

    toast.success("Instellingen opgeslagen");
  };

  const handleAddGalleryImage = async () => {
    if (!newGalleryImage.url) {
      toast.error("Voer een afbeelding URL in");
      return;
    }

    const { error } = await supabase
      .from('gallery_images')
      .insert({
        image_url: newGalleryImage.url,
        title: newGalleryImage.title || null,
        display_order: galleryImages.length,
      });

    if (error) {
      toast.error("Fout bij toevoegen afbeelding");
      return;
    }

    toast.success("Afbeelding toegevoegd");
    setNewGalleryImage({ url: "", title: "" });
    loadGallery();
  };

  const handleDeleteGalleryImage = async (id: string) => {
    const { error } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Fout bij verwijderen");
      return;
    }

    toast.success("Afbeelding verwijderd");
    loadGallery();
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = galleryImages.findIndex((img) => img.id === active.id);
      const newIndex = galleryImages.findIndex((img) => img.id === over.id);

      const newOrder = arrayMove(galleryImages, oldIndex, newIndex);
      setGalleryImages(newOrder);

      // Update display_order in database
      for (let i = 0; i < newOrder.length; i++) {
        await supabase
          .from('gallery_images')
          .update({ display_order: i })
          .eq('id', newOrder[i].id);
      }

      toast.success("Volgorde bijgewerkt");
    }
  };

  return (
    <Tabs defaultValue="hero" className="w-full">
      <TabsList className="grid w-full grid-cols-8">
        <TabsTrigger value="hero">Hero</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
        <TabsTrigger value="about">Over</TabsTrigger>
        <TabsTrigger value="features">Features</TabsTrigger>
        <TabsTrigger value="gallery">Galerij</TabsTrigger>
        <TabsTrigger value="rules">Regels</TabsTrigger>
        <TabsTrigger value="cta">CTA</TabsTrigger>
        <TabsTrigger value="other">Overig</TabsTrigger>
      </TabsList>

      <TabsContent value="hero" className="space-y-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Hero Sectie</CardTitle>
            <CardDescription>Hoofdpagina banner instellingen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Achtergrond Afbeelding URL</Label>
              <Input
                value={config.hero_image_url}
                onChange={(e) => setConfig({ ...config, hero_image_url: e.target.value })}
                placeholder="https://example.com/hero.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input
                value={config.hero_title}
                onChange={(e) => setConfig({ ...config, hero_title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Ondertitel</Label>
              <Input
                value={config.hero_subtitle}
                onChange={(e) => setConfig({ ...config, hero_subtitle: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CTA Button Tekst</Label>
                <Input
                  value={config.hero_cta_text}
                  onChange={(e) => setConfig({ ...config, hero_cta_text: e.target.value })}
                  placeholder="Start Nu"
                />
              </div>
              <div className="space-y-2">
                <Label>CTA Button Link</Label>
                <Input
                  value={config.hero_cta_link}
                  onChange={(e) => setConfig({ ...config, hero_cta_link: e.target.value })}
                  placeholder="/shop"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Roblox Link (voor "Start Nu" button)</Label>
              <Input
                value={config.roblox_link}
                onChange={(e) => setConfig({ ...config, roblox_link: e.target.value })}
                placeholder="https://www.roblox.com/games/..."
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="stats" className="space-y-4 mt-6">
        <StatsManager />
      </TabsContent>

      <TabsContent value="about" className="space-y-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Over Sectie</CardTitle>
            <CardDescription>Informatie over jullie server</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.show_about_section}
                onCheckedChange={(checked) => setConfig({ ...config, show_about_section: checked })}
              />
              <Label>Sectie tonen</Label>
            </div>
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input
                value={config.about_title}
                onChange={(e) => setConfig({ ...config, about_title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={config.about_content}
                onChange={(e) => setConfig({ ...config, about_content: e.target.value })}
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Afbeelding URL</Label>
              <Input
                value={config.about_image_url}
                onChange={(e) => setConfig({ ...config, about_image_url: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="features" className="space-y-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Features Sectie</CardTitle>
            <CardDescription>Hoogtepunten van jullie server</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.show_features_section}
                onCheckedChange={(checked) => setConfig({ ...config, show_features_section: checked })}
              />
              <Label>Sectie tonen</Label>
            </div>
            <div className="space-y-2">
              <Label>Sectie Titel</Label>
              <Input
                value={config.features_title}
                onChange={(e) => setConfig({ ...config, features_title: e.target.value })}
              />
            </div>
            
            {/* Feature 1 */}
            <div className="p-4 border border-border rounded-lg space-y-3">
              <h4 className="font-semibold">Feature 1</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Icon (Emoji)</Label>
                  <Input
                    value={config.feature_1_icon}
                    onChange={(e) => setConfig({ ...config, feature_1_icon: e.target.value })}
                    placeholder="🎮"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Titel</Label>
                  <Input
                    value={config.feature_1_title}
                    onChange={(e) => setConfig({ ...config, feature_1_title: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Beschrijving</Label>
                <Textarea
                  value={config.feature_1_description}
                  onChange={(e) => setConfig({ ...config, feature_1_description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-4 border border-border rounded-lg space-y-3">
              <h4 className="font-semibold">Feature 2</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Icon (Emoji)</Label>
                  <Input
                    value={config.feature_2_icon}
                    onChange={(e) => setConfig({ ...config, feature_2_icon: e.target.value })}
                    placeholder="🎭"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Titel</Label>
                  <Input
                    value={config.feature_2_title}
                    onChange={(e) => setConfig({ ...config, feature_2_title: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Beschrijving</Label>
                <Textarea
                  value={config.feature_2_description}
                  onChange={(e) => setConfig({ ...config, feature_2_description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-4 border border-border rounded-lg space-y-3">
              <h4 className="font-semibold">Feature 3</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Icon (Emoji)</Label>
                  <Input
                    value={config.feature_3_icon}
                    onChange={(e) => setConfig({ ...config, feature_3_icon: e.target.value })}
                    placeholder="⚡"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Titel</Label>
                  <Input
                    value={config.feature_3_title}
                    onChange={(e) => setConfig({ ...config, feature_3_title: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Beschrijving</Label>
                <Textarea
                  value={config.feature_3_description}
                  onChange={(e) => setConfig({ ...config, feature_3_description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="gallery" className="space-y-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Galerij Sectie</CardTitle>
            <CardDescription>Foto's van jullie server</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.show_gallery}
                onCheckedChange={(checked) => setConfig({ ...config, show_gallery: checked })}
              />
              <Label>Galerij tonen</Label>
            </div>
            <div className="space-y-2">
              <Label>Sectie Titel</Label>
              <Input
                value={config.gallery_title}
                onChange={(e) => setConfig({ ...config, gallery_title: e.target.value })}
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <h4 className="font-semibold">Afbeeldingen Beheren</h4>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Afbeelding URL</Label>
                  <Input
                    value={newGalleryImage.url}
                    onChange={(e) => setNewGalleryImage({ ...newGalleryImage, url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Titel (optioneel)</Label>
                  <Input
                    value={newGalleryImage.title}
                    onChange={(e) => setNewGalleryImage({ ...newGalleryImage, title: e.target.value })}
                    placeholder="Beschrijving van afbeelding"
                  />
                </div>
                <Button onClick={handleAddGalleryImage} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Afbeelding Toevoegen
                </Button>
              </div>

              <div className="space-y-2 mt-6">
                <Label>Huidige Afbeeldingen (sleep om volgorde te wijzigen)</Label>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={galleryImages.map(img => img.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {galleryImages.map((image) => (
                      <SortableGalleryItem
                        key={image.id}
                        image={image}
                        onDelete={handleDeleteGalleryImage}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                {galleryImages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nog geen afbeeldingen toegevoegd
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="rules" className="space-y-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Regels Pagina</CardTitle>
            <CardDescription>Instellingen voor de regels pagina</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Pagina Titel</Label>
              <Input
                value={config.rules_page_title}
                onChange={(e) => setConfig({ ...config, rules_page_title: e.target.value })}
                placeholder="Server Regels"
              />
            </div>
            <div className="space-y-2">
              <Label>Pagina Subtitel</Label>
              <Input
                value={config.rules_page_subtitle}
                onChange={(e) => setConfig({ ...config, rules_page_subtitle: e.target.value })}
                placeholder="Selecteer een categorie om de regels te bekijken"
              />
            </div>
            <div className="space-y-2">
              <Label>Waarschuwing Titel</Label>
              <Input
                value={config.rules_warning_title}
                onChange={(e) => setConfig({ ...config, rules_warning_title: e.target.value })}
                placeholder="Belangrijke Waarschuwing"
              />
            </div>
            <div className="space-y-2">
              <Label>Waarschuwing Tekst</Label>
              <Textarea
                value={config.rules_warning_text}
                onChange={(e) => setConfig({ ...config, rules_warning_text: e.target.value })}
                rows={4}
                placeholder="Het overtreden van deze regels kan leiden tot..."
              />
            </div>
            <div className="space-y-2">
              <Label>Footer Tekst</Label>
              <Input
                value={config.rules_footer_text}
                onChange={(e) => setConfig({ ...config, rules_footer_text: e.target.value })}
                placeholder="Heb je vragen over de regels?"
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cta" className="space-y-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Call-to-Action Sectie</CardTitle>
            <CardDescription>Sluit de pagina af met een oproep</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.show_cta_section}
                onCheckedChange={(checked) => setConfig({ ...config, show_cta_section: checked })}
              />
              <Label>Sectie tonen</Label>
            </div>
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input
                value={config.cta_section_title}
                onChange={(e) => setConfig({ ...config, cta_section_title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Beschrijving</Label>
              <Textarea
                value={config.cta_section_description}
                onChange={(e) => setConfig({ ...config, cta_section_description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Button Tekst</Label>
              <Input
                value={config.cta_button_text}
                onChange={(e) => setConfig({ ...config, cta_button_text: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="other" className="space-y-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Overige Instellingen</CardTitle>
            <CardDescription>Discord link en regels</CardDescription>
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
            <div className="space-y-2">
              <Label>Regels Content (Markdown)</Label>
              <Textarea
                value={config.rules_content}
                onChange={(e) => setConfig({ ...config, rules_content: e.target.value })}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <div className="mt-6">
        <Button onClick={handleSave} disabled={loading} className="w-full" size="lg">
          {loading ? "Opslaan..." : "Alle Wijzigingen Opslaan"}
        </Button>
      </div>
    </Tabs>
  );
};
