import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to get Electron API
export const getElectron = () => {
  return typeof window !== 'undefined' ? window.electronAPI : undefined;
};
