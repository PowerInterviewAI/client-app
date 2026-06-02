import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to get the platform API alias exposed by Tauri
export const getElectron = () => {
  return typeof window !== 'undefined' ? window.electronAPI : undefined;
};

export const getCurrentTimestamp = () => {
  return Date.now();
};
