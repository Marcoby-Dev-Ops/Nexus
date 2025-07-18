import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from 'next-themes';
import AppearanceSettings from '@/domains/admin/user/pages/settings/AppearanceSettings';

const meta: Meta<typeof AppearanceSettings> = {
  title: 'Pages/Settings/AppearanceSettings',
  component: AppearanceSettings,
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="p-4 bg-background text-foreground">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AppearanceSettings>;

export const Default: Story = {
  args: {},
}; 