
export interface TranslationResult {
  text: string;
  sentiment?: string;
  confidence: number;
}

export interface FrameData {
  data: string;
  mimeType: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  ANALYZING = 'ANALYZING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR'
}
