/**
 * @file Tabs.test.tsx
 * @description Unit and snapshot tests for the Tabs component.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';

describe('Tabs', () => {
  const TestTabs = () => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
    </Tabs>
  );

  it('renders without crashing', () => {
    render(<TestTabs />);
  });

  it('renders tab triggers', () => {
    const { getByText } = render(<TestTabs />);
    expect(getByText('Tab 1')).toBeInTheDocument();
    expect(getByText('Tab 2')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<TestTabs />);
    expect(asFragment()).toMatchSnapshot();
  });
}); 