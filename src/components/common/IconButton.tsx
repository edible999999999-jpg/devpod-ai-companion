interface IconButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: "default" | "primary" | "danger";
  disabled?: boolean;
}

export function IconButton({
  icon,
  label,
  onClick,
  variant = "default",
  disabled = false,
}: IconButtonProps) {
  const variants: Record<string, string> = {
    default: "bg-slate-700/50 hover:bg-slate-600/50 text-slate-300",
    primary: "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300",
    danger: "bg-red-500/20 hover:bg-red-500/30 text-red-300",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
        transition-colors disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]}
      `}
      title={label}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
