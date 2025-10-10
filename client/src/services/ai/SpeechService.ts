import { BaseService } from "@/core/services/BaseService";

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechServiceResponse {
  success: boolean;
  data?: {
    transcript: string;
    confidence: number;
  };
  error?: string;
}

export class SpeechService extends BaseService {
  private recognition: SpeechRecognition | null = null;
  private isSupported: boolean;

  constructor() {
    super();
    this.isSupported = this.checkBrowserSupport();
  }

  private checkBrowserSupport(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  private createRecognition(): SpeechRecognition | null {
    if (!this.isSupported) {
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    return recognition;
  }

  async startRecording(): Promise<SpeechServiceResponse> {
    try {
      if (!this.isSupported) {
        return this.handleError('Speech recognition is not supported in this browser');
      }

      if (!this.recognition) {
        this.recognition = this.createRecognition();
      }

      if (!this.recognition) {
        return this.handleError('Failed to initialize speech recognition');
      }

      return this.createResponse({ transcript: '', confidence: 0 });
    } catch (error) {
      return this.handleError(`Failed to start recording: ${error}`);
    }
  }

  async stopRecording(): Promise<SpeechServiceResponse> {
    try {
      if (this.recognition) {
        this.recognition.stop();
        this.recognition = null;
      }
      return this.createResponse({ transcript: '', confidence: 0 });
    } catch (error) {
      return this.handleError(`Failed to stop recording: ${error}`);
    }
  }

  async transcribeAudio(_audioBlob: Blob): Promise<SpeechServiceResponse> {
    try {
      if (!this.isSupported) {
        return this.handleError('Speech recognition is not supported in this browser');
      }

      // For now, we'll use the Web Speech API for real-time transcription
      // In a production environment, you might want to use a more robust service like:
      // - OpenAI Whisper API
      // - Google Cloud Speech-to-Text
      // - Azure Speech Services
      
      return this.handleError('Audio file transcription not yet implemented. Use real-time recording instead.');
    } catch (error) {
      return this.handleError(`Failed to transcribe audio: ${error}`);
    }
  }

  isBrowserSupported(): boolean {
    return this.isSupported;
  }

  getRecognition(): SpeechRecognition | null {
    return this.recognition;
  }
}

export const speechService = new SpeechService();
