import { useTranslation } from "react-i18next";
import { Languages, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const LANGS = [
  { code: "en", label: "English" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "hi", label: "हिन्दी" },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const current = LANGS.find((l) => l.code === i18n.language) || LANGS[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full bg-secondary/50">
          <Languages className="w-4 h-4 mr-2" />
          {current.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card">
        {LANGS.map((l) => (
          <DropdownMenuItem key={l.code} onClick={() => i18n.changeLanguage(l.code)} className="cursor-pointer">
            <span className="flex-1">{l.label}</span>
            {i18n.language === l.code && <Check className="w-4 h-4 ml-2 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
