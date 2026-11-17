import React from 'react';

export interface CleanSlateIconProps {
  className?: string;
}

export type CleanSlateIconComponent = React.FC<CleanSlateIconProps>;

const SvgIcon: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className = 'w-4 h-4', children }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={`shrink-0 ${className}`}
  >
    {children}
  </svg>
);

// Row 1
export const SendIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M2.5 3.8L21.5 12L2.5 20.2L5.6 13.4L14.2 12L5.6 10.6L2.5 3.8Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const LockIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7 10V7.5C7 4.74 9.24 2.5 12 2.5C14.76 2.5 17 4.74 17 7.5V10H18C19.1 10 20 10.9 20 12V19.5C20 20.6 19.1 21.5 18 21.5H6C4.9 21.5 4 20.6 4 19.5V12C4 10.9 4.9 10 6 10H7ZM9 7.5C9 5.84 10.34 4.5 12 4.5C13.66 4.5 15 5.84 15 7.5V10H9V7.5ZM12 14C11.17 14 10.5 14.67 10.5 15.5C10.5 16.05 10.8 16.53 11.25 16.79V18.25C11.25 18.66 11.59 19 12 19C12.41 19 12.75 18.66 12.75 18.25V16.79C13.2 16.53 13.5 16.05 13.5 15.5C13.5 14.67 12.83 14 12 14Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const ArrowRightIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M4 12H19M19 12L13.5 6.5M19 12L13.5 17.5"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

export const CheckIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M4.5 12.5L9.5 17.5L19.5 7"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

export const BankIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M12 2.5L3 7.5V9.5H21V7.5L12 2.5ZM5 11V17.5H7.5V11H5ZM10.75 11V17.5H13.25V11H10.75ZM16.5 11V17.5H19V11H16.5ZM3 19V21H21V19H3Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const MagicWandIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M4 20L15.5 8.5M15.5 8.5L13 6L15.5 3.5L18 6L20.5 8.5L18 11L15.5 8.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M6.5 4.5L7.3 6.2L9 7L7.3 7.8L6.5 9.5L5.7 7.8L4 7L5.7 6.2L6.5 4.5Z" fill="currentColor" />
    <path d="M18.5 14.5L19.2 16L20.7 16.7L19.2 17.4L18.5 18.9L17.8 17.4L16.3 16.7L17.8 16L18.5 14.5Z" fill="currentColor" />
  </SvgIcon>
);

export const PinOffIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M3 3L21 21M9 9V10.5L6.5 13.5V15H11.25V21H12.75V15H15M9.5 4H16.5V6L15 7.5V11"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

export const PlusCircleIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M12 8.2V15.8M8.2 12H15.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </SvgIcon>
);

export const CameraIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.2 4.5L7.6 6.5H4.5C3.4 6.5 2.5 7.4 2.5 8.5V18.5C2.5 19.6 3.4 20.5 4.5 20.5H19.5C20.6 20.5 21.5 19.6 21.5 18.5V8.5C21.5 7.4 20.6 6.5 19.5 6.5H16.4L14.8 4.5H9.2ZM12 17C14.21 17 16 15.21 16 13C16 10.79 14.21 9 12 9C9.79 9 8 10.79 8 13C8 15.21 9.79 17 12 17ZM12 15C13.1 15 14 14.1 14 13C14 11.9 13.1 11 12 11C10.9 11 10 11.9 10 13C10 14.1 10.9 15 12 15Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const PrinterIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.5 3.5H17.5V7.5H6.5V3.5ZM4.5 9C3.4 9 2.5 9.9 2.5 11V16.5C2.5 17.6 3.4 18.5 4.5 18.5H6.5V21H17.5V18.5H19.5C20.6 18.5 21.5 17.6 21.5 16.5V11C21.5 9.9 20.6 9 19.5 9H4.5ZM8.5 14.5H15.5V19H8.5V14.5ZM18 12C18.55 12 19 11.55 19 11C19 10.45 18.55 10 18 10C17.45 10 17 10.45 17 11C17 11.55 17.45 12 18 12Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const MapPinIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2.5C8.13 2.5 5 5.63 5 9.5C5 14.75 12 21.5 12 21.5C12 21.5 19 14.75 19 9.5C19 5.63 15.87 2.5 12 2.5ZM12 12C10.62 12 9.5 10.88 9.5 9.5C9.5 8.12 10.62 7 12 7C13.38 7 14.5 8.12 14.5 9.5C14.5 10.88 13.38 12 12 12Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const LinkIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M10.5 13.5C11.4 14.4 12.9 14.4 13.8 13.5L17.8 9.5C19.2 8.1 19.2 5.9 17.8 4.5C16.4 3.1 14.2 3.1 12.8 4.5L11.2 6.1M13.5 10.5C12.6 9.6 11.1 9.6 10.2 10.5L6.2 14.5C4.8 15.9 4.8 18.1 6.2 19.5C7.6 20.9 9.8 20.9 11.2 19.5L12.8 17.9"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

// Row 2
export const ExternalLinkIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M14 4H20M20 4V10M20 4L10.5 13.5M18 13.5V18.5C18 19.6 17.1 20.5 16 20.5H5.5C4.4 20.5 3.5 19.6 3.5 18.5V8C3.5 6.9 4.4 6 5.5 6H10.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

export const SaveIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.5 3.5H16.5L20.5 7.5V19.5C20.5 20.6 19.6 21.5 18.5 21.5H4.5C3.4 21.5 2.5 20.6 2.5 19.5V5.5C2.5 4.4 3.4 3.5 4.5 3.5ZM7 5.5V9.5H15V5.5H7ZM12 18.5C13.93 18.5 15.5 16.93 15.5 15C15.5 13.07 13.93 11.5 12 11.5C10.07 11.5 8.5 13.07 8.5 15C8.5 16.93 10.07 18.5 12 18.5Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const UnlockIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15 7.5C15 5.84 13.66 4.5 12 4.5C10.7 4.5 9.6 5.33 9.18 6.5H7.08C7.56 4.21 9.58 2.5 12 2.5C14.76 2.5 17 4.74 17 7.5V10H18C19.1 10 20 10.9 20 12V19.5C20 20.6 19.1 21.5 18 21.5H6C4.9 21.5 4 20.6 4 19.5V12C4 10.9 4.9 10 6 10H15V7.5ZM12 14C11.17 14 10.5 14.67 10.5 15.5C10.5 16.05 10.8 16.53 11.25 16.79V18.25C11.25 18.66 11.59 19 12 19C12.41 19 12.75 18.66 12.75 18.25V16.79C13.2 16.53 13.5 16.05 13.5 15.5C13.5 14.67 12.83 14 12 14Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const FilterIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M3.5 5H20.5L14 13V19.5L10 17.5V13L3.5 5Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const UserCircleIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2.5C6.75 2.5 2.5 6.75 2.5 12C2.5 17.25 6.75 21.5 12 21.5C17.25 21.5 21.5 17.25 21.5 12C21.5 6.75 17.25 2.5 12 2.5ZM12 6.5C13.66 6.5 15 7.84 15 9.5C15 11.16 13.66 12.5 12 12.5C10.34 12.5 9 11.16 9 9.5C9 7.84 10.34 6.5 12 6.5ZM12 19.5C9.67 19.5 7.6 18.42 6.26 16.73C7.28 15.05 9.48 14 12 14C14.52 14 16.72 15.05 17.74 16.73C16.4 18.42 14.33 19.5 12 19.5Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const MailIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 5H20C21.1 5 22 5.9 22 7V17C22 18.1 21.1 19 20 19H4C2.9 19 2 18.1 2 17V7C2 5.9 2.9 5 4 5ZM20 8L12 13L4 8V7L12 12L20 7V8Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const ShapesIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M12 3L17.5 11.5H6.5L12 3Z" fill="currentColor" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1" fill="currentColor" />
    <circle cx="17" cy="17" r="3.75" fill="currentColor" />
  </SvgIcon>
);

export const TrayInIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M12 4V14.5M12 14.5L8 10.5M12 14.5L16 10.5M4.5 15.5V18.5C4.5 19.33 5.17 20 6 20H18C18.83 20 19.5 19.33 19.5 18.5V15.5"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

export const InfoCircleIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2.5C6.75 2.5 2.5 6.75 2.5 12C2.5 17.25 6.75 21.5 12 21.5C17.25 21.5 21.5 17.25 21.5 12C21.5 6.75 17.25 2.5 12 2.5ZM13.1 17H10.9V10.8H13.1V17ZM12 9.2C11.28 9.2 10.7 8.62 10.7 7.9C10.7 7.18 11.28 6.6 12 6.6C12.72 6.6 13.3 7.18 13.3 7.9C13.3 8.62 12.72 9.2 12 9.2Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const EyeIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 5C6.5 5 2.1 8.6 1 12C2.1 15.4 6.5 19 12 19C17.5 19 21.9 15.4 23 12C21.9 8.6 17.5 5 12 5ZM12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 10.07 10.07 8.5 12 8.5C13.93 8.5 15.5 10.07 15.5 12C15.5 13.93 13.93 15.5 12 15.5ZM12 10.2C11.01 10.2 10.2 11.01 10.2 12C10.2 12.99 11.01 13.8 12 13.8C12.99 13.8 13.8 12.99 13.8 12C13.8 11.01 12.99 10.2 12 10.2Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const RefreshIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M20 12C20 16.42 16.42 20 12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C14.8 4 17.26 5.44 18.7 7.62M19.5 4V8.5H15"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

export const BarChartBoxIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5 3.5H19C20.1 3.5 21 4.4 21 5.5V19.5C21 20.6 20.1 21.5 19 21.5H5C3.9 21.5 3 20.6 3 19.5V5.5C3 4.4 3.9 3.5 5 3.5ZM7 17.5H9.2V11.5H7V17.5ZM10.9 17.5H13.1V7.5H10.9V17.5ZM14.8 17.5H17V13.8H14.8V17.5Z"
      fill="currentColor"
    />
  </SvgIcon>
);

// Row 3
export const HelpCircleIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path
      d="M9.75 9.25C9.75 8.01 10.76 7 12 7C13.24 7 14.25 8.01 14.25 9.25C14.25 10.32 13.5 11.02 12.66 11.42C12.2 11.64 12 12 12 12.5V13.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="16.2" r="1.15" fill="currentColor" />
  </SvgIcon>
);

export const ChevronRightIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M9.5 6.5L15 12L9.5 17.5"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

export const CancelIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M5.7 5.7L18.3 18.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </SvgIcon>
);

export const TrashIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9 3.5H15L16 5.5H19.5V7.5H4.5V5.5H8L9 3.5ZM6 9H18L17 19.5C16.9 20.5 16.05 21.2 15.05 21.2H8.95C7.95 21.2 7.1 20.5 7 19.5L6 9Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const ShieldIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M12 2.5L4.5 5.8V11.3C4.5 16.1 7.7 20.5 12 21.8C16.3 20.5 19.5 16.1 19.5 11.3V5.8L12 2.5Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const ClipboardIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <rect
      x="5.5"
      y="5"
      width="13"
      height="16"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M9 5V4C9 3.17 9.67 2.5 10.5 2.5H13.5C14.33 2.5 15 3.17 15 4V5M9 10.5H15M9 14.5H15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </SvgIcon>
);

export const TrophyIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M7 3.5H17V9C17 11.76 14.76 14 12 14C9.24 14 7 11.76 7 9V3.5ZM4 5H6.5V9.5H5C3.9 9.5 3 8.6 3 7.5V6C3 5.45 3.45 5 4 5ZM17.5 5H20C20.55 5 21 5.45 21 6V7.5C21 8.6 20.1 9.5 19 9.5H17.5V5ZM10.75 14.8H13.25V18H16V20.5H8V18H10.75V14.8Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const CalendarIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7 2.5V4.5H5C3.9 4.5 3 5.4 3 6.5V19.5C3 20.6 3.9 21.5 5 21.5H19C20.1 21.5 21 20.6 21 19.5V6.5C21 5.4 20.1 4.5 19 4.5H17V2.5H15V4.5H9V2.5H7ZM5 9.5V19.5H19V9.5H5ZM7.5 12H10.5V15H7.5V12Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const TrendDownIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M3.5 7L9.5 13L13.5 9L20.5 16M20.5 16V11.2M20.5 16H15.7"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

export const EyeOffIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M3 3L21 21M10.5 10.6C10.18 10.97 10 11.46 10 12C10 13.1 10.9 14 12 14C12.54 14 13.03 13.82 13.4 13.5M6.7 6.8C4.4 8.2 2.8 10.4 2.2 12C3.5 15.2 7.2 18 12 18C13.8 18 15.5 17.5 16.9 16.8M9.9 5.3C10.58 5.1 11.28 5 12 5C16.8 5 20.5 8.8 21.8 12C21.3 13.2 20.4 14.5 19.2 15.6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

export const HistoryIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M4.2 10C5.1 6.5 8.2 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20C8.76 20 5.97 18.08 4.7 15.3M4 5.5V10.5H9M12 7.8V12.2L15 14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

export const ShieldUserIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2.5L4.5 5.8V11.3C4.5 16.1 7.7 20.5 12 21.8C16.3 20.5 19.5 16.1 19.5 11.3V5.8L12 2.5ZM12 7.5C13.25 7.5 14.25 8.5 14.25 9.75C14.25 11 13.25 12 12 12C10.75 12 9.75 11 9.75 9.75C9.75 8.5 10.75 7.5 12 7.5ZM12 13.5C14.1 13.5 15.8 14.5 16.3 16C15.1 17.5 13.6 18.6 12 19.2C10.4 18.6 8.9 17.5 7.7 16C8.2 14.5 9.9 13.5 12 13.5Z"
      fill="currentColor"
    />
  </SvgIcon>
);

// Row 4
export const PlusIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M12 5V19M5 12H19"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </SvgIcon>
);

export const ChevronLeftIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M14.5 6.5L9 12L14.5 17.5"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

export const SyncIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M19.5 9.5C18.45 6.42 15.48 4.2 12 4.2C8.9 4.2 6.24 6.02 5 8.65M4.5 5V9H8.5M4.5 14.5C5.55 17.58 8.52 19.8 12 19.8C15.1 19.8 17.76 17.98 19 15.35M19.5 19V15H15.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

export const EditNoteIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M4 5.5H15V7.5H4V5.5ZM4 9.5H15V11.5H4V9.5ZM4 13.5H11V15.5H4V13.5ZM18.7 9.8L20.2 11.3C20.5 11.6 20.5 12.1 20.2 12.4L14.5 18.1H12V15.6L17.7 9.8C18 9.5 18.4 9.5 18.7 9.8Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const IdBadgeIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.5 5.5H20.5C21.6 5.5 22.5 6.4 22.5 7.5V17.5C22.5 18.6 21.6 19.5 20.5 19.5H3.5C2.4 19.5 1.5 18.6 1.5 17.5V7.5C1.5 6.4 2.4 5.5 3.5 5.5ZM8 9C9.1 9 10 9.9 10 11C10 12.1 9.1 13 8 13C6.9 13 6 12.1 6 11C6 9.9 6.9 9 8 9ZM5 16.5C5.2 14.9 6.5 14 8 14C9.5 14 10.8 14.9 11 16.5H5ZM13 10H19V11.8H13V10ZM13 13.5H18V15.3H13V13.5Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const CopyIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <rect x="8.5" y="7.5" width="11" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
    <path
      d="M15.5 7.5V5.5C15.5 4.4 14.6 3.5 13.5 3.5H6.5C5.4 3.5 4.5 4.4 4.5 5.5V15.5C4.5 16.6 5.4 17.5 6.5 17.5H8.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </SvgIcon>
);

export const ChevronDownIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M6.5 9.5L12 15L17.5 9.5"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

export const AutoGraphIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M3.5 17L8.5 11.5L12.5 14.5L18.5 7.5M18.5 7.5H14.5M18.5 7.5V11.5"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M6.5 3.5L7.3 5.2L9 6L7.3 6.8L6.5 8.5L5.7 6.8L4 6L5.7 5.2L6.5 3.5Z" fill="currentColor" />
  </SvgIcon>
);

export const TrendUpIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M3.5 17L9.5 11L13.5 15L20.5 8M20.5 8V12.8M20.5 8H15.7"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

export const LightbulbIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M9 17.5H15M9.8 20.5H14.2M12 3.5C8.69 3.5 6 6.19 6 9.5C6 11.65 7.13 13.54 8.83 14.59C9.3 14.88 9.6 15.38 9.6 15.94V16H14.4V15.94C14.4 15.38 14.7 14.88 15.17 14.59C16.87 13.54 18 11.65 18 9.5C18 6.19 15.31 3.5 12 3.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

export const ShieldCheckeredIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M12 2.5L4.5 5.8V11.3C4.5 16.1 7.7 20.5 12 21.8C16.3 20.5 19.5 16.1 19.5 11.3V5.8L12 2.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M12 3V11.5H5V5.9L12 3Z" fill="currentColor" />
    <path d="M12 11.5H19C18.6 16 15.7 19.8 12 21.2V11.5Z" fill="currentColor" />
  </SvgIcon>
);

export const PencilIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M4 16.75V20H7.25L17.4 9.85L14.15 6.6L4 16.75ZM20.2 7.05C20.55 6.7 20.55 6.15 20.2 5.8L18.2 3.8C17.85 3.45 17.3 3.45 16.95 3.8L15.3 5.45L18.55 8.7L20.2 7.05Z"
      fill="currentColor"
    />
  </SvgIcon>
);

// Row 5
export const HomeIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M12 3L3 10.5H5.5V20H10V14.5H14V20H18.5V10.5H21L12 3Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const UploadIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M12 3.5L6.5 9.5H10V15.5H14V9.5H17.5L12 3.5ZM4.5 18V20.5H19.5V18H4.5Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const CloseIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M6 6L18 18M18 6L6 18"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
    />
  </SvgIcon>
);

export const CloseCircleIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path
      d="M9 9L15 15M15 9L9 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </SvgIcon>
);

export const BalanceScaleIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M12 3.5V19.5M8 19.5H16M5.5 6.5H18.5M5.5 6.5L3 12.5C3.5 13.7 4.7 14.5 6 14.5C7.3 14.5 8.5 13.7 9 12.5L6.5 6.5M18.5 6.5L16 12.5C16.5 13.7 17.7 14.5 19 14.5C20.3 14.5 21.5 13.7 22 12.5L19.5 6.5"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

export const ScissorsIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <circle cx="6.5" cy="7.5" r="2.75" stroke="currentColor" strokeWidth="2" />
    <circle cx="6.5" cy="16.5" r="2.75" stroke="currentColor" strokeWidth="2" />
    <path
      d="M8.8 9.2L19.5 16.5M8.8 14.8L19.5 7.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </SvgIcon>
);

export const ChevronUpIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M6.5 14.5L12 9L17.5 14.5"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
);

export const ExclamationCircleIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2.5C6.75 2.5 2.5 6.75 2.5 12C2.5 17.25 6.75 21.5 12 21.5C17.25 21.5 21.5 17.25 21.5 12C21.5 6.75 17.25 2.5 12 2.5ZM10.9 7H13.1V13.5H10.9V7ZM12 17.4C11.28 17.4 10.7 16.82 10.7 16.1C10.7 15.38 11.28 14.8 12 14.8C12.72 14.8 13.3 15.38 13.3 16.1C13.3 16.82 12.72 17.4 12 17.4Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const SparklesIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M10.5 3L12.3 8.2L17.5 10L12.3 11.8L10.5 17L8.7 11.8L3.5 10L8.7 8.2L10.5 3Z"
      fill="currentColor"
    />
    <path
      d="M18.5 13.5L19.4 15.6L21.5 16.5L19.4 17.4L18.5 19.5L17.6 17.4L15.5 16.5L17.6 15.6L18.5 13.5Z"
      fill="currentColor"
    />
    <path
      d="M18 4L18.6 5.4L20 6L18.6 6.6L18 8L17.4 6.6L16 6L17.4 5.4L18 4Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const BoltIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M13.5 2.5L4.5 13.5H11.5L10.5 21.5L19.5 10.5H12.5L13.5 2.5Z" fill="currentColor" />
  </SvgIcon>
);

export const WarningTriangleIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 3L2.2 20H21.8L12 3ZM10.9 9.5H13.1V14.5H10.9V9.5ZM12 18C11.34 18 10.8 17.46 10.8 16.8C10.8 16.14 11.34 15.6 12 15.6C12.66 15.6 13.2 16.14 13.2 16.8C13.2 17.46 12.66 18 12 18Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const DownloadIcon: CleanSlateIconComponent = ({ className }) => (
  <SvgIcon className={className}>
    <path
      d="M12 15.5L17.5 9.5H14V3.5H10V9.5H6.5L12 15.5ZM4.5 18V20.5H19.5V18H4.5Z"
      fill="currentColor"
    />
  </SvgIcon>
);
