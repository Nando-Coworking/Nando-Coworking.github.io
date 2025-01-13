import React, { useState, useEffect } from 'react';
import { Container, Form, Button } from 'react-bootstrap';
import Cookies from 'js-cookie';
import { useToast } from '../../ToastContext';

type ThemeOption = 'auto' | 'light' | 'dark';

const Preferences: React.FC = () => {
  const [theme, setTheme] = useState<ThemeOption>('auto');
  const { addToast } = useToast();

  useEffect(() => {
    const savedTheme = (Cookies.get('theme') as ThemeOption) || 'auto';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTheme = e.target.value as ThemeOption;
    setTheme(selectedTheme);
    Cookies.set('theme', selectedTheme, { expires: 365 });
    applyTheme(selectedTheme);
    addToast('Theme updated successfully', 'success');
  };

  const applyTheme = (theme: ThemeOption) => {
    document.body.classList.remove('dark-mode', 'light-mode', 'bg-dark', 'text-white', 'bg-light', 'text-dark');
    
    switch (theme) {
      case 'dark':
        document.body.classList.add('dark-mode', 'bg-dark', 'text-white');
        break;
      case 'light':
        document.body.classList.add('light-mode', 'bg-light', 'text-dark');
        break;
      default:
        // Auto theme logic can be added here
        break;
    }
  };

  const handleSavePreferences = () => {
    addToast('Preferences saved successfully', 'success');
  };

  return (
    <Container className="mt-5">
      <h3>Preferences</h3>
      <Form>
        <Form.Group controlId="themeSelect">
          <Form.Label>Select Theme</Form.Label>
          <Form.Select 
            value={theme} 
            onChange={handleThemeChange}
            className="mb-3"
          >
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Form.Select>
        </Form.Group>
        <Button disabled title="This feature is not available yet"
          variant="primary" 
          className="mt-3" 
          onClick={handleSavePreferences}
        >
          Save Preferences
        </Button>
      </Form>
    </Container>
  );
};

export default Preferences;