import type { SVGProps } from 'react';

/**
 * Minimalist monochrome icon set. Every glyph is hand-tuned on a
 * 24×24 grid, uses `currentColor`, and inherits stroke widths
 * from the SVG defaults. Tailwind text-* utilities tint them.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
};

/* --- Glide bolt mark --- */
export function GlideMark(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 2L4 14h6l-2 8 10-12h-6l2-8Z" fill="currentColor" />
    </svg>
  );
}

/* --- X / Twitter (clean version) --- */
export function XIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* --- VS Code (proper ribbon mark) --- */
export function VSCodeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M17.5 2.2c-.4-.2-.9-.1-1.2.2L4.5 13.1l-2-1.5a.95.95 0 0 0-1.2.07l-.9.83a.95.95 0 0 0 0 1.4L2.6 15.4l-1.4 1.3a.95.95 0 0 0 0 1.4l.9.83c.32.3.81.32 1.16.07l2-1.5L16.3 21.6c.34.32.86.4 1.28.21l3.7-1.78c.4-.2.66-.62.66-1.06V4.13c0-.44-.26-.86-.66-1.06l-3.78-.87Zm.4 5.05L11.1 12l6.8 4.75V7.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* --- Terminal --- */
export function TerminalIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect
        x="2.5"
        y="4"
        width="19"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M6.5 9.5L9.5 12l-3 2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 15H16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* --- Slack (proper hash logo) --- */
export function SlackIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      {/* 4 rounded bars forming Slack's hash mark */}
      <rect x="3" y="9.5" width="13" height="2.4" rx="1.2" fill="currentColor" />
      <rect x="8" y="14.5" width="13" height="2.4" rx="1.2" fill="currentColor" />
      <rect
        x="14.6"
        y="3"
        width="2.4"
        height="13"
        rx="1.2"
        fill="currentColor"
      />
      <rect
        x="7"
        y="8"
        width="2.4"
        height="13"
        rx="1.2"
        fill="currentColor"
      />
    </svg>
  );
}

/* --- Vercel triangle --- */
export function VercelIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l10 17H2L12 3Z" fill="currentColor" />
    </svg>
  );
}

/* --- GitHub --- */
export function GithubIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.36 6.84 9.71.5.1.68-.22.68-.5v-1.74c-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.3.1-2.72 0 0 .84-.28 2.75 1.06A9.36 9.36 0 0112 6.84c.85 0 1.7.12 2.5.35 1.91-1.34 2.75-1.06 2.75-1.06.55 1.42.2 2.46.1 2.72.64.72 1.03 1.64 1.03 2.76 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9v2.81c0 .28.18.61.69.5A10.05 10.05 0 0022 12.23C22 6.58 17.52 2 12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* --- Settings cog --- */
export function CogIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* --- Search loupe --- */
export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M20 20l-3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* --- Sparkle / AI mark --- */
export function SparkleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M12 3l1.6 6.4L20 11l-6.4 1.6L12 19l-1.6-6.4L4 11l6.4-1.6L12 3Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* --- Chat / messages --- */
export function ChatIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5H13l-4 4v-4H5.5C4.67 16 4 15.33 4 14.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* --- Close X --- */
export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* --- Check --- */
export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M5 12.5l4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
