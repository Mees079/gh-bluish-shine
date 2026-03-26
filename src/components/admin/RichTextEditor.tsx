import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, 
  Quote, Minus, Type, Palette, Sparkles
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

const COLORS = [
  { name: "Rood", value: "red" },
  { name: "Blauw", value: "blue" },
  { name: "Groen", value: "green" },
  { name: "Geel", value: "yellow" },
  { name: "Oranje", value: "orange" },
  { name: "Paars", value: "purple" },
  { name: "Roze", value: "pink" },
  { name: "Cyaan", value: "cyan" },
  { name: "Goud", value: "gold" },
];

const COLOR_MAP: Record<string, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  purple: "#a855f7",
  pink: "#ec4899",
  cyan: "#06b6d4",
  gold: "#d4a017",
};

export const RichTextEditor = ({ value, onChange, placeholder, rows = 10 }: RichTextEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = useCallback((before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const newText = value.substring(0, start) + before + (selected || "tekst") + after + value.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newStart = start + before.length;
      const newEnd = newStart + (selected || "tekst").length;
      textarea.setSelectionRange(newStart, newEnd);
    }, 10);
  }, [value, onChange]);

  const insertAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = value.substring(0, start) + text + value.substring(start);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 10);
  }, [value, onChange]);

  const insertLinePrefix = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);

    if (selected) {
      const lines = selected.split("\n").map(line => prefix + line).join("\n");
      const newText = value.substring(0, start) + lines + value.substring(end);
      onChange(newText);
    } else {
      const newText = value.substring(0, start) + "\n" + prefix + "Item" + value.substring(start);
      onChange(newText);
    }

    setTimeout(() => textarea.focus(), 10);
  }, [value, onChange]);

  const toolbarButtons = [
    { icon: <Heading1 className="h-4 w-4" />, title: "Kop 1", action: () => insertAtCursor("\n# ") },
    { icon: <Heading2 className="h-4 w-4" />, title: "Kop 2", action: () => insertAtCursor("\n## ") },
    { icon: <Heading3 className="h-4 w-4" />, title: "Kop 3", action: () => insertAtCursor("\n### ") },
    { divider: true },
    { icon: <Bold className="h-4 w-4" />, title: "Vet", action: () => wrapSelection("**", "**") },
    { icon: <Italic className="h-4 w-4" />, title: "Cursief", action: () => wrapSelection("*", "*") },
    { icon: <Type className="h-4 w-4" />, title: "Doorstrepen", action: () => wrapSelection("~~", "~~") },
    { divider: true },
    { icon: <List className="h-4 w-4" />, title: "Lijst", action: () => insertLinePrefix("- ") },
    { icon: <ListOrdered className="h-4 w-4" />, title: "Genummerd", action: () => insertLinePrefix("1. ") },
    { icon: <Quote className="h-4 w-4" />, title: "Citaat", action: () => insertLinePrefix("> ") },
    { icon: <Minus className="h-4 w-4" />, title: "Scheidingslijn", action: () => insertAtCursor("\n\n---\n\n") },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 p-2 bg-secondary/50 rounded-t-md border border-b-0 border-input">
        {toolbarButtons.map((btn, i) => 
          'divider' in btn ? (
            <div key={i} className="w-px h-6 bg-border mx-1 self-center" />
          ) : (
            <Button
              key={i}
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title={btn.title}
              onClick={(e) => { e.preventDefault(); btn.action(); }}
            >
              {btn.icon}
            </Button>
          )
        )}

        <div className="w-px h-6 bg-border mx-1 self-center" />

        {/* Kleuren */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Kleur">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-3 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className="flex items-center gap-2 px-2 py-1 rounded text-sm hover:bg-accent transition-colors"
                  onClick={() => wrapSelection(`<span style="color:${COLOR_MAP[color.value]}">`, "</span>")}
                >
                  <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: COLOR_MAP[color.value] }} />
                  {color.name}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Effecten */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Effecten">
              <Sparkles className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="space-y-1">
              <button type="button" className="w-full text-left px-2 py-1 rounded text-sm hover:bg-accent" onClick={() => wrapSelection('<span style="font-size:1.5em">', '</span>')}>
                🔤 Grote tekst
              </button>
              <button type="button" className="w-full text-left px-2 py-1 rounded text-sm hover:bg-accent" onClick={() => wrapSelection('<span style="font-size:0.8em">', '</span>')}>
                🔡 Kleine tekst
              </button>
              <button type="button" className="w-full text-left px-2 py-1 rounded text-sm hover:bg-accent" onClick={() => wrapSelection('<span style="text-decoration:underline">', '</span>')}>
                📝 Onderstreept
              </button>
              <button type="button" className="w-full text-left px-2 py-1 rounded text-sm hover:bg-accent" onClick={() => wrapSelection('<span style="background:linear-gradient(90deg,#f97316,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent">', '</span>')}>
                🌈 Gradient tekst
              </button>
              <button type="button" className="w-full text-left px-2 py-1 rounded text-sm hover:bg-accent" onClick={() => wrapSelection('<mark>', '</mark>')}>
                🖍️ Markeren
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Schrijf hier je beschrijving... Gebruik de toolbar hierboven voor opmaak."}
        rows={rows}
        className="rounded-t-none font-mono text-sm"
      />
      
      <p className="text-xs text-muted-foreground">
        💡 Tip: Selecteer tekst en klik een knop om opmaak toe te passen. Markdown wordt ondersteund.
      </p>
    </div>
  );
};
