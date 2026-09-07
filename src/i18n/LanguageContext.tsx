import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { Language, LanguageOption } from "./types";
import { en } from "./locales/en";
import { ur } from "./locales/ur";
import { translateTextToUrdu } from "./agriculturalDictionary";

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    dir: "ltr",
  },
  {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    flag: "🇵🇰",
    dir: "rtl",
  },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: "ltr" | "rtl";
  isRTL: boolean;
  t: (path: string, defaultText?: string, params?: Record<string, string | number>) => string;
  translateText: (text: string | undefined | null) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  supportedLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "cropsense_language";

const dictionaries: Record<Language, any> = {
  en,
  ur,
};

// Helper to resolve nested keys like 'nav.dashboard'
function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj || !path) return undefined;
  const keys = path.split(".");
  let current = obj;
  for (const k of keys) {
    if (current && typeof current === "object" && k in current) {
      current = current[k];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY) as Language;
      if (saved === "en" || saved === "ur") {
        return saved;
      }
    } catch {
      // fallback
    }
    return "en";
  });

  const isRTL = language === "ur";
  const dir: "ltr" | "rtl" = isRTL ? "rtl" : "ltr";

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, newLang);
    } catch (e) {
      console.warn("Could not save language to localStorage", e);
    }
  }, []);

  // Update HTML tag attributes whenever language/RTL changes
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    if (isRTL) {
      document.documentElement.classList.add("rtl");
      document.body.classList.add("font-urdu");
    } else {
      document.documentElement.classList.remove("rtl");
      document.body.classList.remove("font-urdu");
    }
  }, [language, dir, isRTL]);

  const translateText = useCallback(
    (text: string | undefined | null): string => {
      if (!text) return "";
      if (language === "ur") {
        return translateTextToUrdu(text);
      }
      return String(text);
    },
    [language]
  );

  const t = useCallback(
    (path: string, defaultText?: string, params?: Record<string, string | number>): string => {
      const dict = dictionaries[language];
      let value = getNestedValue(dict, path);

      // In Urdu mode, check if we have an explicit Urdu dictionary entry
      if (value === undefined && language === "ur") {
        // First check if defaultText or path maps to Urdu in the agricultural dictionary
        if (defaultText) {
          const dictTranslation = translateTextToUrdu(defaultText);
          if (dictTranslation && dictTranslation !== defaultText) {
            value = dictTranslation;
          }
        }
        if (value === undefined) {
          const pathTranslation = translateTextToUrdu(path);
          if (pathTranslation && pathTranslation !== path) {
            value = pathTranslation;
          }
        }
      }

      // Fallback to English if missing in active language
      if (value === undefined && language !== "en") {
        value = getNestedValue(dictionaries.en, path);
      }

      // If still not found, use defaultText or the last segment of the path
      let result = value !== undefined ? value : defaultText !== undefined ? defaultText : path.split(".").pop() || path;

      if (language === "ur" && typeof result === "string") {
        // If result is still English, try translating it
        const possibleTranslation = translateTextToUrdu(result);
        if (possibleTranslation) {
          result = possibleTranslation;
        }
      }

      // Replace interpolation params like {name}, {count}, {temp}
      if (params && typeof result === "string") {
        Object.entries(params).forEach(([k, v]) => {
          const paramValue = language === "ur" ? translateTextToUrdu(String(v)) : String(v);
          result = (result as string).replace(new RegExp(`\\{${k}\\}`, "g"), paramValue);
        });
      }

      return result;
    },
    [language]
  );

  const formatNumber = useCallback(
    (num: number, options?: Intl.NumberFormatOptions): string => {
      try {
        const locale = language === "ur" ? "ur-PK" : "en-US";
        return new Intl.NumberFormat(locale, options).format(num);
      } catch {
        return String(num);
      }
    },
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      dir,
      isRTL,
      t,
      translateText,
      formatNumber,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [language, setLanguage, dir, isRTL, t, translateText, formatNumber]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
};

export const useLanguage = useTranslation;
