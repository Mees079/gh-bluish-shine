import { useEffect, useState } from "react";
import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGS = [
  { code: "nl", label: "Nederlands" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
];

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

const readCookieLang = () => {
  const match = document.cookie.match(/googtrans=\/[a-z]{2}\/([a-z-]+)/i);
  return match?.[1] ?? "nl";
};

const setTranslateCookie = (lang: string) => {
  const value = lang === "nl" ? "" : `/nl/${lang}`;
  const hostname = window.location.hostname;
  const expires = lang === "nl" ? "Thu, 01 Jan 1970 00:00:00 GMT" : "";
  const base = `googtrans=${value}; path=/;`;
  document.cookie = expires ? `${base} expires=${expires}` : base;
  document.cookie = expires
    ? `googtrans=${value}; path=/; domain=.${hostname}; expires=${expires}`
    : `googtrans=${value}; path=/; domain=.${hostname}`;
};

export const LanguageSwitcher = ({ compact = false }: { compact?: boolean }) => {
  const [current, setCurrent] = useState("nl");

  useEffect(() => {
    setCurrent(readCookieLang());

    if (document.getElementById("google-translate-script")) return;

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      new window.google.translate.TranslateElement(
        { pageLanguage: "nl", autoDisplay: false },
        "google_translate_element"
      );
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const change = (lang: string) => {
    setTranslateCookie(lang);
    setCurrent(lang);
    window.location.reload();
  };

  const active = LANGS.find((l) => l.code === current) ?? LANGS[0];

  return (
    <>
      <div id="google_translate_element" className="hidden" />
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-navy-foreground/80 hover:text-navy-foreground hover:bg-white/10 transition-colors notranslate"
          aria-label="Taal wijzigen"
        >
          <Globe className="h-4 w-4" />
          {!compact && <span className="uppercase">{active.code}</span>}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Taal</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {LANGS.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => change(lang.code)}
              className="flex items-center justify-between notranslate"
            >
              {lang.label}
              {lang.code === current && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
