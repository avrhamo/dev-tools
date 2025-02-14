// src/types/components.ts
import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';
import { EditorProps } from '@monaco-editor/react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
}

export interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

export interface CodeEditorProps extends Partial<EditorProps> {
  value: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
}

// src/types/layout.ts
import { LucideIcon } from 'lucide-react';

export interface SidebarTool {
  path: string;
  name: string;
  icon: LucideIcon;
}

// src/types/api-tester.ts
export type Step = 'curl' | 'database' | 'mapping' | 'execution';

export interface EncodedHeader {
  original: string;
  decoded: any;
}

export interface CurlData {
  method: string;
  url: string;
  headers: Record<string, string>;
  data?: any;
  pathParams?: Array<{ name: string; value: string }>;
  encodedHeaders?: Record<string, EncodedHeader>;
}

export interface ConnectionData {
  connectionString: string;
  database: string;
  collection: string;
  sampleDocument: any;
}

export interface FieldMapping {
  [curlField: string]: string;
}

export interface TypeCasting {
  [field: string]: {
    type: string;
    format?: string;
  };
}

export interface TestConfig {
  curl: CurlData | null;
  connection: ConnectionData | null;
  fieldMappings: {
    fieldMappings: FieldMapping;
    typeCastings: TypeCasting;
  } | null;
}