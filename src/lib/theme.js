// Keep in sync with the inline script in index.html, which applies both before React loads.
export const THEME_STORAGE_KEY = "loopi_theme";
export const COLOR_THEME_STORAGE_KEY = "loopi_color_theme";

/** Color themes defined in index.css ([data-theme]). `swatch` is the theme's primary color. */
export const COLOR_THEMES = [
  { id: "pink", label: "Pink", swatch: "hsl(340 82% 59%)" },
  { id: "blue", label: "Blue", swatch: "hsl(217 85% 55%)" },
  { id: "violet", label: "Violet", swatch: "hsl(262 72% 58%)" },
  { id: "teal", label: "Teal", swatch: "hsl(178 72% 30%)" },
  { id: "orange", label: "Orange", swatch: "hsl(20 88% 45%)" },
];
const DEFAULT_COLOR_THEME = "pink";

const remember = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked (private mode): the choice lasts until reload.
  }
};

export const isDarkMode = () => document.documentElement.classList.contains("dark");

/** Turn dark mode on/off for the whole app and remember the choice on this device. */
export const setDarkMode = (enabled) => {
  document.documentElement.classList.toggle("dark", enabled);
  remember(THEME_STORAGE_KEY, enabled ? "dark" : "light");
};

export const getColorTheme = () =>
  document.documentElement.dataset.theme || DEFAULT_COLOR_THEME;

/** Switch the UI color theme. Pink is the default and uses no attribute. */
export const setColorTheme = (id) => {
  const theme = COLOR_THEMES.some((item) => item.id === id) ? id : DEFAULT_COLOR_THEME;
  if (theme === DEFAULT_COLOR_THEME) {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = theme;
  }
  remember(COLOR_THEME_STORAGE_KEY, theme);
};
