import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'auto';

interface ThemeContextType {
  theme: Theme;
  fontSize: string;
  tabSize: string;
  setTheme: (theme: Theme) => void;
  setFontSize: (fontSize: string) => void;
  setTabSize: (tabSize: string) => void;
  applySettings: (settings: { theme: Theme; fontSize: string; tabSize: string }) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [fontSize, setFontSize] = useState('14');
  const [tabSize, setTabSize] = useState('2');

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

  const applySettings = (settings: { theme: Theme; fontSize: string; tabSize: string }) => {
    setTheme(settings.theme);
    setFontSize(settings.fontSize);
    setTabSize(settings.tabSize);
    
    applyTheme(settings.theme);
    applyFontSize(settings.fontSize);
    applyTabSize(settings.tabSize);

    // Save to localStorage
    localStorage.setItem('leviatan-theme', settings.theme);
    localStorage.setItem('leviatan-font-size', settings.fontSize);
    localStorage.setItem('leviatan-tab-size', settings.tabSize);
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('leviatan-theme') as Theme || 'dark';
    const savedFontSize = localStorage.getItem('leviatan-font-size') || '14';
    const savedTabSize = localStorage.getItem('leviatan-tab-size') || '2';

    setTheme(savedTheme);
    setFontSize(savedFontSize);
    setTabSize(savedTabSize);

    applyTheme(savedTheme);
    applyFontSize(savedFontSize);
    applyTabSize(savedTabSize);
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
      setTheme: handleSetTheme,
      setFontSize: handleSetFontSize,
      setTabSize: handleSetTabSize,
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