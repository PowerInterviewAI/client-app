export interface InterviewConf {
  photo: string;
  username: string;
  profileData: string;
  jobDescription: string;
}

export enum Language {
  English = 'en',
}

export interface Config {
  interviewConf: InterviewConf;
  language: Language;

  // Authentication
  sessionToken: string;
  email: string;
  password: string;
  rememberMe: boolean;

  // Transcription options
  audioInputDeviceName: string;

  // Video control options - Face Swap Control
  faceSwap: boolean;
  cameraDeviceName: string;
  videoWidth: number;
  videoHeight: number;
  enableFaceEnhance: boolean;
}
