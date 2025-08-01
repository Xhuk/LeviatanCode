import { ReactNode } from "react";

interface WorkspaceProps {
  children: ReactNode;
}

export function Workspace({ children }: WorkspaceProps) {
  return (
    <div className="flex h-full bg-replit-dark">
      {children}
    </div>
  );
}
