// Brand colour themes. Purple is the default; the user can switch from the colour picker in the navbar.
export interface Theme {
  name: string;
  value: string;
  hover: string;
}

export const THEMES: Theme[] = [
  { name: "Purple", value: "#7c3aed", hover: "#6d28d9" },
  { name: "Coral", value: "#f0563f", hover: "#dc4b34" },
  { name: "Ocean", value: "#147d92", hover: "#0f6678" },
  { name: "Forest", value: "#2f8061", hover: "#25664d" },
  { name: "Rose", value: "#db2777", hover: "#be185d" },
];

export const DEFAULT_THEME = THEMES[0];
export const THEME_STORAGE_KEY = "wayfeir-theme";

export function applyTheme(theme: Theme) {
  document.documentElement.style.setProperty("--brand", theme.value);
  document.documentElement.style.setProperty("--brand-hover", theme.hover);
}

export function savedTheme(): Theme {
  try {
    return THEMES.find((theme) => theme.value === localStorage.getItem(THEME_STORAGE_KEY)) ?? DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

// Runs before first paint (see the root layout) so the saved colour shows on the login and register pages
// too, with no flash of the default.
export const themeInitScript = `(function(){try{var t=${JSON.stringify(THEMES)};var v=localStorage.getItem("${THEME_STORAGE_KEY}");for(var i=0;i<t.length;i++){if(t[i].value===v){var s=document.documentElement.style;s.setProperty("--brand",t[i].value);s.setProperty("--brand-hover",t[i].hover);break;}}}catch(e){}})();`;
