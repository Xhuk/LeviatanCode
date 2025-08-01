import { ReactNode, useState, useRef, useEffect, useCallback } from "react";

interface ResizablePanelGroupProps {
  direction: "horizontal" | "vertical";
  className?: string;
  children: ReactNode;
}

interface ResizablePanelProps {
  defaultSize: number;
  minSize?: number;
  maxSize?: number;
  children: ReactNode;
}

interface ResizableHandleProps {
  className?: string;
}

export function ResizablePanelGroup({ 
  direction, 
  className = "", 
  children 
}: ResizablePanelGroupProps) {
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };
  }, [isResizing, direction, handleMouseUp]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    // Resizing logic would be implemented here
    // For now, this is a simplified version
  }, [isResizing]);

  return (
    <div 
      ref={containerRef}
      className={`flex ${direction === "horizontal" ? "flex-row" : "flex-col"} ${className}`}
    >
      {children}
    </div>
  );
}

export function ResizablePanel({ 
  defaultSize, 
  minSize = 10, 
  maxSize = 90, 
  children 
}: ResizablePanelProps) {
  const [size, setSize] = useState(defaultSize);

  return (
    <div 
      className="flex-shrink-0"
      style={{ 
        flexBasis: `${size}%`,
        minWidth: `${minSize}%`,
        maxWidth: `${maxSize}%`
      }}
    >
      {children}
    </div>
  );
}

export function ResizableHandle({ className = "" }: ResizableHandleProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  return (
    <div
      className={`resizer ${className} ${isDragging ? 'bg-replit-blue' : ''}`}
      onMouseDown={handleMouseDown}
      style={{
        cursor: "col-resize",
        width: "4px",
        backgroundColor: "transparent",
        borderRight: "1px solid var(--replit-border)",
        transition: "background-color 0.2s"
      }}
    />
  );
}
