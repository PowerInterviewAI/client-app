export enum Speaker {
  Self = 'self',
  Other = 'other',
}

export interface Transcript {
  timestamp: number;
  text: string;
  speaker: Speaker;
}
