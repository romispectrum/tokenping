const SIZE_CLASSES = {
  sm: "w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0",
  lg: "w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0",
};

type ChainIconProps = {
  icon: string;
  color: string;
  size: keyof typeof SIZE_CLASSES;
};

/** The chain's emoji on a tile tinted with its brand color (hex alpha suffixes 30/10/40). */
export const ChainIcon = ({ icon, color, size }: ChainIconProps) => (
  <div
    className={SIZE_CLASSES[size]}
    style={{
      background: `linear-gradient(135deg, ${color}30, ${color}10)`,
      border: `1px solid ${color}40`,
    }}
  >
    {icon}
  </div>
);
