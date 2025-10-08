import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSignupOptimization } from '@/hooks/useSignupOptimization';
import { OptimizedSignupField } from '@/components/auth/OptimizedSignupField';
import { SignupProgressIndicator } from '@/components/auth/SignupProgressIndicator';
import { SocialProofBanner } from '@/components/auth/SocialProofBanner';
import { QuickStartGuide } from '@/components/auth/QuickStartGuide';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component for useSignupOptimization hook
function TestSignupComponent() {
  const {
    formData,
    currentStep,
    // errors intentionally omitted when unused
    isValid,
    isDirty,
    autoSaveStatus,
    progress,
    timeSpent,
    updateField,
    goToStep,
    getFieldError,
    isStepComplete,
    clearSavedData,
  } = useSignupOptimization();

  return (
    <div>
      <div data-testid="current-step">{currentStep}</div>
      <div data-testid="is-valid">{isValid.toString()}</div>
      <div data-testid="is-dirty">{isDirty.toString()}</div>
      <div data-testid="auto-save-status">{autoSaveStatus}</div>
      <div data-testid="progress">{progress}</div>
      <div data-testid="time-spent">{timeSpent}</div>
      
      <input
        data-testid="business-name"
        value={formData.businessName}
        onChange={(e) => updateField('businessName', e.target.value)}
      />
      
      <div data-testid="business-name-error">{getFieldError('businessName')}</div>
      
      <button
        data-testid="next-step"
        onClick={() => goToStep('contact-info')}
        disabled={!isStepComplete('business-info')}
      >
        Next Step
      </button>
      
      <button data-testid="clear-data" onClick={clearSavedData}>
        Clear Data
      </button>
    </div>
  );
}

describe('Signup Optimization System', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('useSignupOptimization Hook', () => {
    it('should initialize with default values', () => {
      render(<TestSignupComponent />);
      
      expect(screen.getByTestId('current-step')).toHaveTextContent('business-info');
      expect(screen.getByTestId('is-valid')).toHaveTextContent('false');
      expect(screen.getByTestId('is-dirty')).toHaveTextContent('false');
      expect(screen.getByTestId('auto-save-status')).toHaveTextContent('saved');
      expect(screen.getByTestId('progress')).toHaveTextContent('0');
    });

    it('should update form data and trigger validation', async () => {
      render(<TestSignupComponent />);
      
      const businessNameInput = screen.getByTestId('business-name');
      fireEvent.change(businessNameInput, { target: { value: 'Test Business' } });
      
      await waitFor(() => {
        expect(businessNameInput).toHaveValue('Test Business');
      });
      
      // Should trigger auto-save
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled();
      });
    });

    it('should load saved data from localStorage', () => {
      const savedData = {
        formData: { businessName: 'Saved Business' },
        currentStep: 'contact-info',
        timeSpent: 60,
        timestamp: Date.now(),
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData));
      
      render(<TestSignupComponent />);
      
      expect(screen.getByTestId('current-step')).toHaveTextContent('contact-info');
      expect(screen.getByTestId('business-name')).toHaveValue('Saved Business');
    });

    it('should clear saved data', () => {
      render(<TestSignupComponent />);
      
      const clearButton = screen.getByTestId('clear-data');
      fireEvent.click(clearButton);
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('nexus_signup_draft');
    });
  });

  describe('OptimizedSignupField Component', () => {
    it('should render with proper validation states', () => {
      const mockOnChange = jest.fn();
      
      render(
        <OptimizedSignupField
          type="text"
          name="testField"
          label="Test Field"
          value=""
          onChange={mockOnChange}
          error=""
          placeholder="Enter test value"
          required
        />
      );
      
      expect(screen.getByLabelText('Test Field *')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter test value')).toBeInTheDocument();
    });

    it('should show error state when error is provided', () => {
      const mockOnChange = jest.fn();
      
      render(
        <OptimizedSignupField
          type="text"
          name="testField"
          label="Test Field"
          value=""
          onChange={mockOnChange}
          error="This field is required"
          required
        />
      );
      
      const input = screen.getByLabelText('Test Field *');
      fireEvent.focus(input);
      fireEvent.blur(input);
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should show success state when field is valid', () => {
      const mockOnChange = jest.fn();
      
      render(
        <OptimizedSignupField
          type="text"
          name="testField"
          label="Test Field"
          value="Valid Value"
          onChange={mockOnChange}
          error=""
          required
        />
      );
      
      const input = screen.getByLabelText('Test Field *');
      fireEvent.focus(input);
      fireEvent.blur(input);
      
      expect(screen.getByText('Looks good!')).toBeInTheDocument();
    });
  });

  describe('SignupProgressIndicator Component', () => {
    it('should render progress information correctly', () => {
      render(
        <SignupProgressIndicator
          currentStep="contact-info"
          progress={66}
          timeSpent={120}
          autoSaveStatus="saved"
          isDirty={true}
        />
      );
      
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('66%')).toBeInTheDocument();
      expect(screen.getByText('Time: 2:00')).toBeInTheDocument();
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('should show different auto-save statuses', () => {
      const { rerender } = render(
        <SignupProgressIndicator
          currentStep="business-info"
          progress={33}
          timeSpent={60}
          autoSaveStatus="saving"
          isDirty={true}
        />
      );
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      
      rerender(
        <SignupProgressIndicator
          currentStep="business-info"
          progress={33}
          timeSpent={60}
          autoSaveStatus="error"
          isDirty={true}
        />
      );
      
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });

  describe('SocialProofBanner Component', () => {
    it('should not render initially', () => {
      render(<SocialProofBanner />);
      
      expect(screen.queryByText('Trusted by 10,000+ businesses')).not.toBeInTheDocument();
    });

    it('should show after delay', async () => {
      jest.useFakeTimers();
      
      render(<SocialProofBanner />);
      
      // Fast-forward time
      jest.advanceTimersByTime(2000);
      
      await waitFor(() => {
        expect(screen.getByText('Trusted by 10,000+ businesses')).toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });

    it('should allow closing', async () => {
      jest.useFakeTimers();
      
      render(<SocialProofBanner />);
      
      jest.advanceTimersByTime(2000);
      
      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Trusted by 10,000+ businesses')).not.toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });
  });

  describe('QuickStartGuide Component', () => {
    it('should render with current step information', () => {
      const mockOnClose = jest.fn();
      
      render(
        <QuickStartGuide
          currentStep="business-info"
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByText('Quick Start Guide')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('Business Information')).toBeInTheDocument();
      expect(screen.getByText('Tell us about your business')).toBeInTheDocument();
    });

    it('should expand and show tips when clicked', () => {
      const mockOnClose = jest.fn();
      
      render(
        <QuickStartGuide
          currentStep="business-info"
          onClose={mockOnClose}
        />
      );
      
      const expandButton = screen.getByRole('button', { name: /expand/i });
      fireEvent.click(expandButton);
      
      expect(screen.getByText('Quick Tips:')).toBeInTheDocument();
      expect(screen.getByText('Use your official business name')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      const mockOnClose = jest.fn();
      
      render(
        <QuickStartGuide
          currentStep="business-info"
          onClose={mockOnClose}
        />
      );
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});

