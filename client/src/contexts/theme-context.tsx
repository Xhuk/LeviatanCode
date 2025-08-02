import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'auto';

interface ThemeContextType {
  theme: Theme;
  fontSize: string;
  tabSize: string;
  accentColor: string;
  setTheme: (theme: Theme) => void;
  setFontSize: (fontSize: string) => void;
  setTabSize: (tabSize: string) => void;
  setAccentColor: (color: string) => void;
  applySettings: (settings: { theme: Theme; fontSize: string; tabSize: string; accentColor?: string }) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [fontSize, setFontSize] = useState('14');
  const [tabSize, setTabSize] = useState('2');
  const [accentColor, setAccentColor] = useState('#22c55e'); // Default Leviatan green

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    if (newTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      root.classList.toggle('light', !prefersDark);
    } else {
      root.classList.remove('dark', 'light');
      root.classList.add(newTheme);
    }
  };

  const applyFontSize = (newFontSize: string) => {
    const root = document.documentElement;
    root.style.setProperty('--editor-font-size', `${newFontSize}px`);
    
    // Also apply to Monaco Editor globally
    if ((window as any).monaco) {
      (window as any).monaco.editor.getModels().forEach((model: any) => {
        const editors = (window as any).monaco.editor.getEditors();
        editors.forEach((editor: any) => {
          editor.updateOptions({ fontSize: parseInt(newFontSize) });
        });
      });
    }
  };

  const applyTabSize = (newTabSize: string) => {
    const root = document.documentElement;
    root.style.setProperty('--editor-tab-size', newTabSize);
    
    // Also apply to Monaco Editor globally
    if ((window as any).monaco) {
      (window as any).monaco.editor.getModels().forEach((model: any) => {
        const editors = (window as any).monaco.editor.getEditors();
        editors.forEach((editor: any) => {
          editor.updateOptions({ 
            tabSize: parseInt(newTabSize),
            insertSpaces: true
          });
        });
      });
    }
  };

  const applyAccentColor = (newAccentColor: string) => {
    const root = document.documentElement;
    // Convert hex to RGB for alpha variations
    const hex = newAccentColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    root.style.setProperty('--accent-color', newAccentColor);
    root.style.setProperty('--accent-color-rgb', `${r}, ${g}, ${b}`);
  };

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('leviatan-theme', newTheme);
  };

  const handleSetFontSize = (newFontSize: string) => {
    setFontSize(newFontSize);
    applyFontSize(newFontSize);
    localStorage.setItem('leviatan-font-size', newFontSize);
  };

  const handleSetTabSize = (newTabSize: string) => {
    setTabSize(newTabSize);
    applyTabSize(newTabSize);
    localStorage.setItem('leviatan-tab-size', newTabSize);
  };

  const handleSetAccentColor = (newAccentColor: string) => {
    setAccentColor(newAccentColor);
    applyAccentColor(newAccentColor);
    localStorage.setItem('leviatan-accent-color', newAccentColor);
  };

  const applySettings = (settings: { theme: Theme; fontSize: string; tabSize: string; accentColor?: string }) => {
    setTheme(settings.theme);
    setFontSize(settings.fontSize);
    setTabSize(settings.tabSize);
    if (settings.accentColor) {
      setAccentColor(settings.accentColor);
    }
    
    applyTheme(settings.theme);
    applyFontSize(settings.fontSize);
    applyTabSize(settings.tabSize);
    if (settings.accentColor) {
      applyAccentColor(settings.accentColor);
    }

    // Save to localStorage
    localStorage.setItem('leviatan-theme', settings.theme);
    localStorage.setItem('leviatan-font-size', settings.fontSize);
    localStorage.setItem('leviatan-tab-size', settings.tabSize);
    if (settings.accentColor) {
      localStorage.setItem('leviatan-accent-color', settings.accentColor);
    }
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('leviatan-theme') as Theme || 'dark';
    const savedFontSize = localStorage.getItem('leviatan-font-size') || '14';
    const savedTabSize = localStorage.getItem('leviatan-tab-size') || '2';
    const savedAccentColor = localStorage.getItem('leviatan-accent-color') || '#22c55e';

    setTheme(savedTheme);
    setFontSize(savedFontSize);
    setTabSize(savedTabSize);
    setAccentColor(savedAccentColor);

    applyTheme(savedTheme);
    applyFontSize(savedFontSize);
    applyTabSize(savedTabSize);
    applyAccentColor(savedAccentColor);
  }, []);

  // Listen for system theme changes when theme is 'auto'
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('auto');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{
      theme,
      fontSize,
      tabSize,
      accentColor,
      setTheme: handleSetTheme,
      setFontSize: handleSetFontSize,
      setTabSize: handleSetTabSize,
      setAccentColor: handleSetAccentColor,
      applySettings
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}