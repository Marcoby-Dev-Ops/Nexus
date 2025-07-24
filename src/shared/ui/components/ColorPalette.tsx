import React from 'react';

interface ColorSampleProps {
  name: string;
  color: string;
  textColor?: string;
}

const ColorSample: React.FC<ColorSampleProps> = ({ name, color, textColor = 'text-primary-foreground' }) => (
  <div className="flex flex-col">
    <div 
      className={`h-20 rounded-md flex items-center justify-center ${textColor}`}
      style={{ backgroundColor: color }}
    >
      <span className="font-medium">{color}</span>
    </div>
    <span className="mt-2 text-sm text-foreground font-medium">{name}</span>
  </div>
);

export const ColorPalette: React.FC = () => {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Nexus Brand Colors</h2>
        <p className="text-muted-foreground mb-6">
          Official brand color palette for the Nexus business operating system
        </p>
        
        <h3 className="text-lg font-bold mb-3">Primary Green Palette</h3>
        <div className="grid grid-cols-2 md: grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <ColorSample name="Primary" color="#006837" />
          <ColorSample name="Secondary" color="#00a651" />
          <ColorSample name="Tertiary" color="#008f4c" />
          <ColorSample name="Dark" color="#00331b" />
          <ColorSample name="Dark Alt" color="#013a1f" />
        </div>
        
        <h3 className="text-lg font-bold mb-3">Neutral Colors</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <ColorSample name="Black" color="#000000" />
          <ColorSample name="Gray 950" color="#111111" />
          <ColorSample name="Gray 900" color="#1a1a1a" textColor="text-primary-foreground" />
          <ColorSample name="Gray 800" color="#232323" textColor="text-primary-foreground" />
          <ColorSample name="Gray 700" color="#272727" textColor="text-primary-foreground" />
          <ColorSample name="Gray 200" color="#e4f0ec" textColor="text-foreground" />
          <ColorSample name="Gray 100" color="#f5f9f5" textColor="text-foreground" />
          <ColorSample name="White" color="#ffffff" textColor="text-foreground" />
        </div>
        
        <h3 className="text-lg font-bold mb-3">Accent Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ColorSample name="Blue" color="#007aff" />
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Usage Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Primary Button */}
          <div className="p-6 border rounded-lg space-y-4">
            <h3 className="font-medium">Primary Button</h3>
            <button className="bg-brand-primary hover:bg-brand-secondary text-primary-foreground px-4 py-2 rounded-md transition-colors">
              Get Started
            </button>
          </div>
          
          {/* Card with Dark Accent */}
          <div className="p-6 border rounded-lg space-y-4">
            <h3 className="font-medium">Card with Accent</h3>
            <div className="border rounded-md overflow-hidden">
              <div className="h-2 bg-brand-dark"></div>
              <div className="p-4">
                <h4 className="font-medium">Card Title</h4>
                <p className="text-sm text-brand-gray-700">Card content goes here</p>
              </div>
            </div>
          </div>
          
          {/* Highlight Banner */}
          <div className="p-6 border rounded-lg space-y-4">
            <h3 className="font-medium">Highlight Banner</h3>
            <div className="bg-brand-gray-100 border border-brand-tertiary p-4 rounded-md">
              <p className="text-sm flex items-center">
                <span className="mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-brand-primary">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                  </svg>
                </span>
                New feature available: AI-powered analytics now live!
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Dark Mode Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-brand-gray-900 text-primary-foreground rounded-lg space-y-4">
            <h3 className="font-medium">Dark Mode Interface</h3>
            <div className="space-y-4">
              <div className="bg-brand-gray-800 p-4 rounded-md">
                <p className="text-sm">Dark card on dark background</p>
              </div>
              <button className="bg-brand-secondary hover:bg-brand-primary text-primary-foreground px-4 py-2 rounded-md transition-colors">
                Action Button
              </button>
              <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full bg-brand-tertiary"></span>
                <span className="text-sm">Active Status</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full bg-brand-blue"></span>
                <span className="text-sm">Accent Indicator</span>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-card rounded-lg space-y-4">
            <h3 className="font-medium">Light Mode Interface</h3>
            <div className="space-y-4">
              <div className="bg-brand-gray-100 p-4 rounded-md">
                <p className="text-sm">Light card on light background</p>
              </div>
              <button className="bg-brand-primary hover:bg-brand-secondary text-primary-foreground px-4 py-2 rounded-md transition-colors">
                Action Button
              </button>
              <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full bg-brand-tertiary"></span>
                <span className="text-sm">Active Status</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full bg-brand-blue"></span>
                <span className="text-sm">Accent Indicator</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPalette; 