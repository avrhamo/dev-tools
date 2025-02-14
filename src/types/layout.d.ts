export interface SidebarTool {
    path: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
  }