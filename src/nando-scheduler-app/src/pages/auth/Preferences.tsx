import React, { useState, useEffect } from 'react';
import { Container, Form, Button } from 'react-bootstrap';
import Cookies from 'js-cookie';
import { useToast } from '../../ToastContext';
import LogoForLight from '../../assets/LogoWide_ForLight.png';
import LogoForDark from '../../assets/LogoWide_ForDark.png';
import FaviconForLight from '../../assets/LogoSquare_ForLight.png';
import FaviconForDark from '../../assets/LogoSquare_ForDark.png';

type ThemeOption = 'auto' | 'light' | 'dark';

const Preferences: React.FC = () => {
  const [theme, setTheme] = useState<ThemeOption>('auto');
  const { addToast } = useToast();

  // Apply theme when component mounts and when theme changes
  useEffect(() => {
    const savedTheme = (Cookies.get('theme') as ThemeOption) || 'auto';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const updateFavicon = (isDark: boolean) => {
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon) {
      favicon.href = isDark ? FaviconForDark : FaviconForLight;
    }
  };

  const updateLogo = (isDark: boolean) => {
    const logo = document.querySelector<HTMLImageElement>('.navbar-brand img');
    if (logo) {
      logo.src = isDark ? LogoForDark : LogoForLight;
    }
  };

  const applyTheme = (selectedTheme: ThemeOption) => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Determine if we should use dark mode
    const shouldUseDark = selectedTheme === 'dark' || 
      (selectedTheme === 'auto' && prefersDark);

    // Remove existing theme classes
    document.body.classList.remove('bg-light', 'bg-dark');
    
    // Apply new theme
    if (shouldUseDark) {
      document.body.classList.add('bg-dark');
      root.setAttribute('data-bs-theme', 'dark');
      updateFavicon(true);
      updateLogo(true);
    } else {
      document.body.classList.add('bg-light');
      root.setAttribute('data-bs-theme', 'light');
      updateFavicon(false);
      updateLogo(false);
    }
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTheme = e.target.value as ThemeOption;
    setTheme(selectedTheme);
    Cookies.set('theme', selectedTheme, { expires: 365 });
    applyTheme(selectedTheme);
    addToast('Theme updated successfully', 'success');
  };

  // Watch for system theme changes when in auto mode
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'auto') {
        applyTheme('auto');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const handleSavePreferences = () => {
    addToast('Preferences saved successfully', 'success');
  };

  return (
    <Container className="mt-5">
      <h3><i className="fas fa-palette me-2"></i>Theme Preferences</h3>
      <p className="text-muted mb-4" style={{ borderBottom: '#dddddd solid 1px' }}>
        Customize the appearance of the application.
      </p>
      
      <Form>
        <Form.Group controlId="themeSelect">
          <Form.Label>Color Theme</Form.Label>
          <Form.Select 
            value={theme} 
            onChange={handleThemeChange}
            className="mb-3"
          >
            <option value="auto">Auto (Use System Theme)</option>
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
          </Form.Select>
          <Form.Text className="text-muted">
            Auto mode will automatically switch between light and dark themes based on your system preferences.
          </Form.Text>
        </Form.Group>
        {/* <Button
          variant="primary" 
          className="mt-3" 
          onClick={handleSavePreferences}
        >
          Save Preferences
        </Button> */}
      </Form>
    </Container>
  );
};

export default Preferences;