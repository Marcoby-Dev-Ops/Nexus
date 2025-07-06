import React from 'react';
import { useTheme } from '@/components/ui/theme-provider';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/components/ui/theme-provider';

export const ThemePanel: React.FC = () => {
  const { theme, setTheme, primaryColor, setPrimaryColor } = useTheme();

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-background border-l border-border shadow-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Theme Panel</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Mode</h3>
          <div className="flex space-x-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
            >
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
            >
              Dark
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              onClick={() => setTheme('system')}
            >
              System
            </Button>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-2">Primary Color</h3>
          <div className="flex space-x-2">
            {COLORS.map(color => (
              <button
                key={color.name}
                className={`w-8 h-8 rounded-full border-2 ${
                  primaryColor === color.name ? 'border-foreground' : 'border-transparent'
                }`}
                style={{ backgroundColor: `hsl(${color.value})` }}
                onClick={() => setPrimaryColor(color.name)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 