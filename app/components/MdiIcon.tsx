interface MdiIconProps {
  path: string;
  size?: number;
  className?: string;
}

export default function MdiIcon({
  path,
  size = 24,
  className = "",
}: MdiIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
    >
      <path d={path} />
    </svg>
  );
}
