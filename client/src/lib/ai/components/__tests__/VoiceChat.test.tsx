import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModernStreamingComposer from '../ModernStreamingComposer';
import { speechService } from '@/services/ai/SpeechService';

// Mock the speech service
jest.mock('@/services/SpeechService', () => ({
  speechService: {
    isBrowserSupported: jest.fn(),
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
    getRecognition: jest.fn(),
  },
}));

// Mock the toast
jest.mock('@/shared/ui/components/Toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('Voice Chat in ModernStreamingComposer', () => {
  const mockSpeechService = speechService as jest.Mocked<typeof speechService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show microphone button', () => {
    render(<ModernStreamingComposer agentId="test-agent" />);
    
    const micButton = screen.getByRole('button', { name: /microphone/i });
    expect(micButton).toBeInTheDocument();
  });

  it('should handle unsupported browser gracefully', async () => {
    mockSpeechService.isBrowserSupported.mockReturnValue(false);
    
    render(<ModernStreamingComposer agentId="test-agent" />);
    
    const micButton = screen.getByRole('button', { name: /microphone/i });
    fireEvent.click(micButton);
    
    await waitFor(() => {
      expect(mockSpeechService.isBrowserSupported).toHaveBeenCalled();
    });
  });

  it('should start recording when microphone is clicked', async () => {
    mockSpeechService.isBrowserSupported.mockReturnValue(true);
    mockSpeechService.startRecording.mockResolvedValue({
      success: true,
      data: { transcript: '', confidence: 0 },
    });
    
    const mockRecognition = {
      onresult: null,
      onerror: null,
      onend: null,
      start: jest.fn(),
      stop: jest.fn(),
    };
    mockSpeechService.getRecognition.mockReturnValue(mockRecognition as any);
    
    render(<ModernStreamingComposer agentId="test-agent" />);
    
    const micButton = screen.getByRole('button', { name: /microphone/i });
    fireEvent.click(micButton);
    
    await waitFor(() => {
      expect(mockSpeechService.startRecording).toHaveBeenCalled();
      expect(mockRecognition.start).toHaveBeenCalled();
    });
  });

  it('should show listening state when recording', async () => {
    mockSpeechService.isBrowserSupported.mockReturnValue(true);
    mockSpeechService.startRecording.mockResolvedValue({
      success: true,
      data: { transcript: '', confidence: 0 },
    });
    
    const mockRecognition = {
      onresult: null,
      onerror: null,
      onend: null,
      start: jest.fn(),
      stop: jest.fn(),
    };
    mockSpeechService.getRecognition.mockReturnValue(mockRecognition as any);
    
    render(<ModernStreamingComposer agentId="test-agent" />);
    
    const micButton = screen.getByRole('button', { name: /microphone/i });
    fireEvent.click(micButton);
    
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/listening/i);
      expect(textarea).toBeInTheDocument();
    });
  });
});
