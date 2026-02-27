export function TerminalWindow({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-black/85 backdrop-blur-sm border border-white/[0.06] overflow-hidden relative ${className}`}>
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-terminal-surface/60 border-b border-white/[0.04]">
        <span className="text-xs text-gray-500 ml-2 font-mono">{title}</span>
      </div>
      {/* Content */}
      <div className="font-mono flex-1 min-h-0 flex flex-col">{children}</div>
    </div>
  );
}
