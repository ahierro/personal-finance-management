/** Inline icons, no external dependency. They inherit the text colour. */

interface IconProps {
  readonly size?: number;
}

function base(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };
}

export function PlusIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M8 3.2v9.6M3.2 8h9.6" />
    </svg>
  );
}

export function SearchIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="7.2" cy="7.2" r="4.3" />
      <path d="M10.4 10.4L13.2 13.2" />
    </svg>
  );
}

export function CloseIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

export function CalendarIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="2.4" y="3.4" width="11.2" height="10.2" rx="1.6" />
      <path d="M2.4 6.6h11.2M5.6 2.2v2.4M10.4 2.2v2.4" />
    </svg>
  );
}

export function EditIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M11.1 2.6a1.4 1.4 0 0 1 2 2l-7 7-2.7.7.7-2.7z" />
      <path d="M3 13.6h10" />
    </svg>
  );
}

export function TrashIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M2.8 4.4h10.4M6.4 4.4V3.2a.8.8 0 0 1 .8-.8h1.6a.8.8 0 0 1 .8.8v1.2" />
      <path d="M4.4 4.4l.5 8.2a1 1 0 0 0 1 .9h4.2a1 1 0 0 0 1-.9l.5-8.2" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M9.8 3.6L5.4 8l4.4 4.4" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M6.2 3.6L10.6 8l-4.4 4.4" />
    </svg>
  );
}

export function AlertIcon({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="8" cy="8" r="5.6" />
      <path d="M8 5.2v3.4M8 10.8h.01" />
    </svg>
  );
}

export function GlobeIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="8" cy="8" r="5.6" />
      <path d="M2.4 8h11.2M8 2.4c1.5 1.7 2.3 3.6 2.3 5.6S9.5 11.9 8 13.6C6.5 11.9 5.7 10 5.7 8S6.5 4.1 8 2.4z" />
    </svg>
  );
}
