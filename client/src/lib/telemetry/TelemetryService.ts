import axios from 'axios';

type TelemetryEvent = {
  type: string;
  timestamp?: number;
  payload?: Record<string, any>;
  userId?: string | null;
};

class TelemetryService {
  private buffer: TelemetryEvent[] = [];
  private flushInterval = 2000; // ms
  private maxBuffer = 50;
  private timer?: number;

  constructor() {
    this.timer = window.setInterval(() => this.flush(), this.flushInterval);
  }

  recordEvent(ev: TelemetryEvent) {
    this.buffer.push({ ...ev, timestamp: Date.now() });
    if (this.buffer.length >= this.maxBuffer) this.flush();
  }

  async flush() {
    if (this.buffer.length === 0) return;
    const payload = this.buffer.splice(0, this.buffer.length);
    try {
      await axios.post('/api/telemetry/batch', payload);
    } catch (unknownErr) {
      // If post fails, requeue up to some limit
      const err = unknownErr as any;
      console.warn('Telemetry flush failed, requeueing', err?.message || err);
      this.buffer.unshift(...payload.slice(0, 10));
    }
  }
}

export const telemetryService = new TelemetryService();

export default telemetryService;
