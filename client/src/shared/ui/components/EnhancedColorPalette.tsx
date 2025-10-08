import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { CheckCircle, AlertTriangle, Info, XCircle, Eye, EyeOff } from 'lucide-react';

interface ColorSampleProps {
  name: string;
  hex: string;
  hsl: string;
  usage: string;
  className?: string;
}

const ColorSample: React.FC<ColorSampleProps> = ({ name, hex, hsl, usage, className = '' }) => (
  <div className={`p-4 rounded-lg border ${className}`}>
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-semibold text-sm">{name}</h4>
      <Badge variant="outline" className="text-xs">
        {hex}
      </Badge>
    </div>
    <div className="space-y-1 text-xs text-muted-foreground">
      <p>HSL: {hsl}</p>
      <p className="text-xs">{usage}</p>
    </div>
  </div>
);

interface ContrastDemoProps {
  bgColor: string;
  textColor: string;
  label: string;
}

const ContrastDemo: React.FC<ContrastDemoProps> = ({ bgColor, textColor, label }) => (
  <div 
    className={`p-4 rounded-lg ${bgColor} ${textColor}`}
    style={{ backgroundColor: bgColor, color: textColor }}
  >
    <p className="text-sm font-medium">{label}</p>
    <p className="text-xs opacity-80">Sample text for contrast testing</p>
  </div>
);

export const EnhancedColorPalette: React.FC = () => {
  const [showContrast, setShowContrast] = React.useState(false);

  return (
    <div className="p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Enhanced Nexus Color System
        </h1>
        <p className="text-muted-foreground text-lg">
          Built around your favorite green with excellent readability
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <Badge className="bg-success text-success-foreground">
            WCAG AA+ Compliant
          </Badge>
          <Badge className="bg-primary text-primary-foreground">
            Green-Centric Design
          </Badge>
          <Badge className="bg-info text-info-foreground">
            Accessibility First
          </Badge>
        </div>
      </div>

      {/* Primary Green Palette */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary"></div>
            Primary Green Palette (Your Favorite!)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ColorSample
              name="Primary"
              hex="#006837"
              hsl="145 100% 22%"
              usage="Main brand color, buttons, links"
              className="bg-primary text-primary-foreground"
            />
            <ColorSample
              name="Secondary"
              hex="#00a651"
              hsl="148 100% 35%"
              usage="Secondary actions, highlights"
              className="bg-secondary text-secondary-foreground"
            />
            <ColorSample
              name="Tertiary"
              hex="#008f4c"
              hsl="156 100% 28%"
              usage="Alternative green, accents"
              className="bg-tertiary text-tertiary-foreground"
            />
            <ColorSample
              name="Success"
              hex="#10b981"
              hsl="142 72% 29%"
              usage="Success states, confirmations"
              className="bg-success text-success-foreground"
            />
            <ColorSample
              name="Primary Light"
              hex="#f0f7f4"
              hsl="145 100% 97%"
              usage="Subtle backgrounds"
              className="bg-primary-subtle text-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* Neutral Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Neutral Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Light Mode</h3>
              <div className="space-y-2">
                <ColorSample
                  name="Background"
                  hex="#fafdfa"
                  hsl="150 40% 98%"
                  usage="Main background"
                  className="bg-background text-foreground border"
                />
                <ColorSample
                  name="Foreground"
                  hex="#141414"
                  hsl="160 25% 8%"
                  usage="Primary text"
                  className="bg-foreground text-background"
                />
                <ColorSample
                  name="Card"
                  hex="#ffffff"
                  hsl="0 0% 100%"
                  usage="Card backgrounds"
                  className="bg-card text-card-foreground border"
                />
                <ColorSample
                  name="Muted"
                  hex="#f0f7f4"
                  hsl="160 30% 94%"
                  usage="Subtle backgrounds"
                  className="bg-muted text-muted-foreground"
                />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Dark Mode</h3>
              <div className="space-y-2">
                <ColorSample
                  name="Background"
                  hex="#141414"
                  hsl="160 25% 8%"
                  usage="Main background"
                  className="bg-background text-foreground border"
                />
                <ColorSample
                  name="Foreground"
                  hex="#fafafa"
                  hsl="0 0% 98%"
                  usage="Primary text"
                  className="bg-foreground text-background"
                />
                <ColorSample
                  name="Card"
                  hex="#1e1e1e"
                  hsl="160 20% 12%"
                  usage="Card backgrounds"
                  className="bg-card text-card-foreground border"
                />
                <ColorSample
                  name="Muted"
                  hex="#1e1e1e"
                  hsl="160 20% 12%"
                  usage="Subtle backgrounds"
                  className="bg-muted text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Semantic Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Semantic Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="font-medium">Success</span>
              </div>
              <ColorSample
                name="Light Mode"
                hex="#10b981"
                hsl="142 72% 29%"
                usage="Confirmations, completed actions"
                className="bg-success text-success-foreground"
              />
              <ColorSample
                name="Dark Mode"
                hex="#22c55e"
                hsl="142 70% 45%"
                usage="Confirmations, completed actions"
                className="bg-success text-success-foreground"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="font-medium">Warning</span>
              </div>
              <ColorSample
                name="Light Mode"
                hex="#f59e0b"
                hsl="38 92% 50%"
                usage="Warnings, cautionary information"
                className="bg-warning text-warning-foreground"
              />
              <ColorSample
                name="Dark Mode"
                hex="#fbbf24"
                hsl="38 95% 60%"
                usage="Warnings, cautionary information"
                className="bg-warning text-warning-foreground"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                <span className="font-medium">Error</span>
              </div>
              <ColorSample
                name="Light Mode"
                hex="#ef4444"
                hsl="0 84% 60%"
                usage="Errors, destructive actions"
                className="bg-destructive text-destructive-foreground"
              />
              <ColorSample
                name="Dark Mode"
                hex="#f87171"
                hsl="0 90% 65%"
                usage="Errors, destructive actions"
                className="bg-destructive text-destructive-foreground"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-info" />
                <span className="font-medium">Info</span>
              </div>
              <ColorSample
                name="Light Mode"
                hex="#3b82f6"
                hsl="217 92% 51%"
                usage="Information, neutral notifications"
                className="bg-info text-info-foreground"
              />
              <ColorSample
                name="Dark Mode"
                hex="#60a5fa"
                hsl="217 90% 60%"
                usage="Information, neutral notifications"
                className="bg-info text-info-foreground"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contrast Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Contrast Testing</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContrast(!showContrast)}
            >
              {showContrast ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showContrast ? 'Hide' : 'Show'} Contrast
            </Button>
          </CardTitle>
        </CardHeader>
        {showContrast && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Light Mode Contrast</h4>
                <div className="space-y-2">
                  <ContrastDemo
                    bgColor="bg-background"
                    textColor="text-foreground"
                    label="Primary Text"
                  />
                  <ContrastDemo
                    bgColor="bg-muted"
                    textColor="text-muted-foreground"
                    label="Secondary Text"
                  />
                  <ContrastDemo
                    bgColor="bg-primary"
                    textColor="text-primary-foreground"
                    label="Primary Button"
                  />
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Dark Mode Contrast</h4>
                <div className="space-y-2">
                  <ContrastDemo
                    bgColor="bg-background"
                    textColor="text-foreground"
                    label="Primary Text"
                  />
                  <ContrastDemo
                    bgColor="bg-muted"
                    textColor="text-muted-foreground"
                    label="Secondary Text"
                  />
                  <ContrastDemo
                    bgColor="bg-primary"
                    textColor="text-primary-foreground"
                    label="Primary Button"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Component Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Buttons</h3>
              <div className="flex flex-wrap gap-2">
                <Button className="bg-primary text-primary-foreground">
                  Primary
                </Button>
                <Button variant="secondary" className="bg-secondary text-secondary-foreground">
                  Secondary
                </Button>
                <Button className="bg-success text-success-foreground">
                  Success
                </Button>
                <Button className="bg-destructive text-destructive-foreground">
                  Danger
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Cards & Alerts</h3>
              <div className="space-y-2">
                <Card className="bg-card text-card-foreground border">
                  <CardContent className="p-4">
                    <p className="text-sm">Standard card with excellent contrast</p>
                  </CardContent>
                </Card>
                <div className="bg-warning-subtle border border-warning text-warning-foreground p-3 rounded-lg">
                  <p className="text-sm">Warning alert with proper contrast</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Typography</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Heading 1</h1>
              <p className="text-muted-foreground text-sm">Font: Inter, Weight: 600, Line-height: 1.3</p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Heading 2</h2>
              <p className="text-muted-foreground text-sm">Font: Inter, Weight: 600, Line-height: 1.3</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Heading 3</h3>
              <p className="text-muted-foreground text-sm">Font: Inter, Weight: 600, Line-height: 1.3</p>
            </div>
            <div>
              <p className="text-foreground mb-2">
                Body text with excellent readability. This is the main content text that users will read most often.
                It uses Inter font with a line-height of 1.6 and letter-spacing of -0.01em for optimal readability.
              </p>
              <p className="text-muted-foreground text-sm">
                Font: Inter, Weight: 400, Line-height: 1.6, Letter-spacing: -0.01em
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 
