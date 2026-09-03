export type TabKey =
  | "dashboard"
  | "scanner"
  | "weather"
  | "crops"
  | "irrigation"
  | "disease"
  | "advisor"
  | "analytics"
  | "alerts"
  | "settings";

export interface NavRoute {
  key: TabKey;
  label: string;
  path: string;
  aliases: string[];
}

export const NAV_ROUTES: NavRoute[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    aliases: ["/", "/dashboard", "dashboard", "Dashboard", "Overview", "overview"],
  },
  {
    key: "scanner",
    label: "Crop Scanner",
    path: "/crop-scanner",
    aliases: [
      "/crop-scanner",
      "/scanner",
      "crop-scanner",
      "scanner",
      "Crop Scanner",
      "crop scanner",
      "scan",
      "Scan",
    ],
  },
  {
    key: "weather",
    label: "Weather",
    path: "/weather",
    aliases: ["/weather", "weather", "Weather"],
  },
  {
    key: "crops",
    label: "My Crops",
    path: "/my-crops",
    aliases: ["/my-crops", "/crops", "my-crops", "crops", "My Crops", "my crops", "Crops"],
  },
  {
    key: "irrigation",
    label: "Irrigation Advisor",
    path: "/irrigation",
    aliases: [
      "/irrigation",
      "/irrigation-advisor",
      "irrigation",
      "irrigation-advisor",
      "Irrigation Advisor",
      "irrigation advisor",
      "Irrigation",
      "irrigate",
    ],
  },
  {
    key: "disease",
    label: "Disease Risk",
    path: "/disease-risk",
    aliases: [
      "/disease-risk",
      "/disease",
      "disease-risk",
      "disease",
      "Disease Risk",
      "disease risk",
      "Disease",
    ],
  },
  {
    key: "advisor",
    label: "Farm Advisor",
    path: "/farm-advisor",
    aliases: [
      "/farm-advisor",
      "/advisor",
      "farm-advisor",
      "advisor",
      "Farm Advisor",
      "farm advisor",
      "Advisor",
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    path: "/analytics",
    aliases: ["/analytics", "analytics", "Analytics"],
  },
  {
    key: "alerts",
    label: "Alerts",
    path: "/alerts",
    aliases: ["/alerts", "alerts", "Alerts", "Notifications", "notifications"],
  },
  {
    key: "settings",
    label: "Settings",
    path: "/settings",
    aliases: ["/settings", "settings", "Settings", "Farm Settings", "farm settings"],
  },
];

/**
 * Normalizes any tab name, key, path, hash, or alias into a canonical TabKey
 */
export function normalizeTab(input?: string | null): TabKey {
  if (!input || typeof input !== "string") return "dashboard";
  
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/^[#\/]+/, "")
    .replace(/\/$/, "");

  if (!cleaned || cleaned === "" || cleaned === "dashboard" || cleaned === "overview") {
    return "dashboard";
  }

  // Exact matching against route keys, paths, labels, and aliases
  for (const route of NAV_ROUTES) {
    if (route.key.toLowerCase() === cleaned) return route.key;
    if (route.path.replace(/^[#\/]+/, "").toLowerCase() === cleaned) return route.key;
    if (route.label.toLowerCase() === cleaned) return route.key;
    for (const alias of route.aliases) {
      if (alias.toLowerCase().replace(/^[#\/]+/, "") === cleaned) {
        return route.key;
      }
    }
  }

  // Robust fuzzy matching
  if (cleaned.includes("scan")) return "scanner";
  if (cleaned.includes("weath")) return "weather";
  if (cleaned.includes("crop")) return "crops";
  if (cleaned.includes("irrig")) return "irrigation";
  if (cleaned.includes("diseas")) return "disease";
  if (cleaned.includes("advis")) return "advisor";
  if (cleaned.includes("analyt") || cleaned.includes("chart")) return "analytics";
  if (cleaned.includes("alert") || cleaned.includes("notif")) return "alerts";
  if (cleaned.includes("sett") || cleaned.includes("farm")) return "settings";

  return "dashboard";
}

/**
 * Gets canonical URL path for a TabKey or alias
 */
export function getPathForTab(tab: TabKey | string): string {
  const key = normalizeTab(tab);
  const route = NAV_ROUTES.find((r) => r.key === key);
  return route ? route.path : "/dashboard";
}

/**
 * Gets official display label for a TabKey or alias
 */
export function getLabelForTab(tab: TabKey | string): string {
  const key = normalizeTab(tab);
  const route = NAV_ROUTES.find((r) => r.key === key);
  return route ? route.label : "Dashboard";
}

/**
 * Checks current browser location to extract active tab on initial mount or popstate
 */
export function getTabFromLocation(): TabKey {
  if (typeof window === "undefined") return "dashboard";

  // Check URL path first
  const pathname = window.location.pathname;
  if (pathname && pathname !== "/" && pathname !== "") {
    return normalizeTab(pathname);
  }

  // Check URL hash if present
  const hash = window.location.hash;
  if (hash && hash.length > 1) {
    return normalizeTab(hash);
  }

  return "dashboard";
}
