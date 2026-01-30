import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
}

export const ImageUploadField = ({ 
  label, 
  value, 
  onChange, 
  bucket = "home-images",
  folder = ""
}: ImageUploadFieldProps) => {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Alleen afbeeldingen zijn toegestaan");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Bestand mag niet groter zijn dan 5MB");
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      onChange(urlData.publicUrl);
      toast.success("Afbeelding geüpload!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Fout bij uploaden: " + (error.message || "Onbekende fout"));
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      {/* Current image preview */}
      {value && (
        <div className="relative inline-block">
          <img 
            src={value} 
            alt="Preview" 
            className="w-full max-w-xs h-32 object-cover rounded-lg border border-border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Drag and drop zone */}
      {!value && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200 ease-in-out
            ${isDragging 
              ? 'border-primary bg-primary/10 scale-[1.02]' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Uploaden...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className={`p-3 rounded-full ${isDragging ? 'bg-primary/20' : 'bg-muted'}`}>
                <ImageIcon className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isDragging ? 'Laat los om te uploaden' : 'Sleep een afbeelding hierheen'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  of klik om te bladeren
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WEBP tot 5MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id={`file-upload-${label}`}
      />

      {/* Change image button when image exists */}
      {value && (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          size="sm"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploaden...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Andere afbeelding kiezen
            </>
          )}
        </Button>
      )}

      {/* URL input as fallback */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Of voer een URL in:</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="text-sm"
        />
      </div>
    </div>
  );
};
