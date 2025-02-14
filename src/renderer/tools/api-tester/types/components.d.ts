import { ReactNode } from 'react';

// Button Component Types
export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

// Card Component Types
export interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

// Input Component Types
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  className?: string;
}

// CodeEditor Component Types
export interface CodeEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
  options?: Record<string, unknown>;
}