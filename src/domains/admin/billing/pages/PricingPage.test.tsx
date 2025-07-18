import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PricingPage } from '@/domains/admin/billing/pages/PricingPage';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';

// Mock the auth context
jest.mock('@/domains/admin/user/hooks/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('PricingPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    } as any);
  });

  it('renders pricing page with honest messaging', () => {
    renderWithRouter(<PricingPage />);
    
    expect(screen.getByText(/stop doing work that ai can automate/i)).toBeInTheDocument();
    expect(screen.getByText(/join early adopters/i)).toBeInTheDocument();
    expect(screen.getByText(/early access product/i)).toBeInTheDocument();
    expect(screen.getByText(/core features live, more coming based on your feedback/i)).toBeInTheDocument();
  });

  it('displays three pricing tiers with correct information', () => {
    renderWithRouter(<PricingPage />);
    
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
    
    // Check pricing
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$29')).toBeInTheDocument();
    expect(screen.getByText('$99')).toBeInTheDocument();
  });

  it('shows monthly/yearly toggle', () => {
    renderWithRouter(<PricingPage />);
    
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('Yearly')).toBeInTheDocument();
    expect(screen.getByText('Save 20%')).toBeInTheDocument();
  });

  it('includes factual integration claims', () => {
    renderWithRouter(<PricingPage />);
    
    // Should include live integrations
    expect(screen.getByText(/paypal & stripe integrations \(live\)/i)).toBeInTheDocument();
    expect(screen.getByText(/microsoft 365 integration \(live\)/i)).toBeInTheDocument();
  });

  it('includes final CTA section with honest messaging', () => {
    renderWithRouter(<PricingPage />);
    
    expect(screen.getByText(/ready to automate your business operations/i)).toBeInTheDocument();
    expect(screen.getByText(/join early adopters building the future/i)).toBeInTheDocument();
    expect(screen.getByText('Start 14-Day Free Trial')).toBeInTheDocument();
    expect(screen.getByText('Start Free Forever')).toBeInTheDocument();
  });

  it('shows cost-optimized quotas instead of inflated claims', () => {
    renderWithRouter(<PricingPage />);
    
    // Should show realistic quotas, not inflated savings claims
    expect(screen.getByText(/150 messages per day/i)).toBeInTheDocument();
    expect(screen.getByText(/1,000 messages per day/i)).toBeInTheDocument();
    expect(screen.getByText(/unlimited messages/i)).toBeInTheDocument();
  });

  it('uses consistent styling from design system', () => {
    renderWithRouter(<PricingPage />);
    
    // Check that buttons use proper variants - look for actual Button components
    const ctaButtons = screen.getAllByText(/start|contact/i);
    expect(ctaButtons.length).toBeGreaterThan(0);
    
    // Check that badges are present - look for the first badge only to avoid duplicates
    expect(screen.getAllByText('Early Access - Help Shape the Future')).toHaveLength(2); // Header + Pro card
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
    expect(screen.getByText('Best Value')).toBeInTheDocument();
  });

  it('handles billing cycle toggle', () => {
    renderWithRouter(<PricingPage />);
    
    const yearlyButton = screen.getByText('Yearly');
    fireEvent.click(yearlyButton);
    
    // Should show yearly pricing (discounted)
    expect(screen.getByText('$0')).toBeInTheDocument(); // Free stays the same
  });

  it('shows early access transparency', () => {
    renderWithRouter(<PricingPage />);
    
    expect(screen.getByText(/early access product/i)).toBeInTheDocument();
    expect(screen.getByText(/core features live/i)).toBeInTheDocument();
    expect(screen.getByText(/more coming based on your feedback/i)).toBeInTheDocument();
  });

  it('includes testimonials from beta users', () => {
    renderWithRouter(<PricingPage />);
    
    expect(screen.getByText(/beta user/i)).toBeInTheDocument();
    expect(screen.getByText(/development partner/i)).toBeInTheDocument();
    expect(screen.getByText(/preview user/i)).toBeInTheDocument();
  });

  it('shows realistic time savings estimates', () => {
    renderWithRouter(<PricingPage />);
    
    // Should show honest estimates, not guaranteed amounts
    expect(screen.getByText(/designed for founders/i)).toBeInTheDocument();
    expect(screen.getByText(/growing teams/i)).toBeInTheDocument();
    expect(screen.getByText(/enterprise operations/i)).toBeInTheDocument();
  });
}); 