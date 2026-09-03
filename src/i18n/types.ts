export type Language = "en" | "ur";

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  dir: "ltr" | "rtl";
}

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}
