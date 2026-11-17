import React from 'react';
import type { CleanSlateIconComponent } from './CleanSlateIcons';

/**
 * Official CleanSlate Button System
 * 6 Standard Figma Variants:
 * - 'white': Secondary light button (#FFFFFF bg, #3E4A4F text, #010101 border)
 * - 'dark-yellow': Dark highlight yellow button (#34314C bg, #F9F45D text & border)
 * - 'dark-periwinkle': Dark highlight periwinkle button (#34314C bg, #AEBBFD text & border)
 * - 'dark': Solid dark button (#34314C bg, #FFFFFF text, #010101 border)
 * - 'yellow': Primary brand yellow button (#F9F45D bg, #3B3B3B text, #010101 border)
 * - 'periwinkle': Brand periwinkle button (#AEBBFD bg, #3B3B3B text, #010101 border)
 *
 * Semantic Status Exceptions (Important Success / Warning / Error Status Buttons):
 * - 'status-success'
 * - 'status-warning'
 * - 'status-error'
 */
export type CleanSlateButtonVariant =
  | 'white'
  | 'dark-yellow'
  | 'dark-periwinkle'
  | 'dark'
  | 'yellow'
  | 'periwinkle'
  | 'status-success'
  | 'status-warning'
  | 'status-error';

export type CleanSlateButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

const VARIANT_CLASSES: Record<CleanSlateButtonVariant, string> = {
  white:
    'bg-[#FFFFFF] text-[#3E4A4F] border-[#010101] hover:bg-slate-50',
  'dark-yellow':
    'bg-[#34314C] text-[#F9F45D] border-[#F9F45D] hover:bg-[#3f3b5c]',
  'dark-periwinkle':
    'bg-[#34314C] text-[#AEBBFD] border-[#AEBBFD] hover:bg-[#3f3b5c]',
  dark:
    'bg-[#34314C] text-[#FFFFFF] border-[#010101] hover:bg-[#3f3b5c]',
  yellow:
    'bg-[#F9F45D] text-[#3B3B3B] border-[#010101] hover:brightness-105',
  periwinkle:
    'bg-[#AEBBFD] text-[#3B3B3B] border-[#010101] hover:brightness-105',
  'status-success':
    'bg-[#16a34a] text-white border-[#010101] hover:bg-[#15803d]',
  'status-warning':
    'bg-[#fbbf24] text-[#1d1a27] border-[#010101] hover:bg-[#f59e0b]',
  'status-error':
    'bg-[#dc2626] text-white border-[#010101] hover:bg-[#b91c1c]',
};

const SIZE_CLASSES: Record<CleanSlateButtonSize, string> = {
  xs: 'px-2.5 py-1 text-[11px] gap-1.5 rounded-lg',
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-xl',
  md: 'px-4 py-2 text-xs sm:text-sm gap-2 rounded-xl',
  lg: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
  icon: 'p-2 rounded-xl',
};

const BASE_CLASSES =
  'inline-flex items-center justify-center font-bold border-[1.5px] shadow-[2px_3px_0px_#010101] transition-all whitespace-nowrap select-none cursor-pointer active:translate-x-[1px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AEBBFD] focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-[2px_3px_0px_#010101]';

export function getCleanSlateButtonClass(
  variant: CleanSlateButtonVariant = 'white',
  size: CleanSlateButtonSize = 'md',
  fullWidth = false,
  extraClasses = ''
): string {
  return [
    BASE_CLASSES,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth ? 'w-full' : '',
    extraClasses,
  ]
    .filter(Boolean)
    .join(' ');
}

interface CommonProps {
  variant?: CleanSlateButtonVariant;
  size?: CleanSlateButtonSize;
  fullWidth?: boolean;
  leftIcon?: CleanSlateIconComponent;
  rightIcon?: CleanSlateIconComponent;
  iconClassName?: string;
  children?: React.ReactNode;
  className?: string;
}

type ButtonElementProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    as?: 'button';
  };

type AnchorElementProps = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    as: 'a';
  };

type LabelElementProps = CommonProps &
  Omit<React.LabelHTMLAttributes<HTMLLabelElement>, keyof CommonProps> & {
    as: 'label';
  };

export type CleanSlateButtonProps =
  | ButtonElementProps
  | AnchorElementProps
  | LabelElementProps;

export const CleanSlateButton: React.FC<CleanSlateButtonProps> = (props) => {
  const {
    variant = 'white',
    size = 'md',
    fullWidth = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    iconClassName,
    children,
    className = '',
    as = 'button',
    ...rest
  } = props;

  const classes = getCleanSlateButtonClass(variant, size, fullWidth, className);
  const defaultIconSize =
    size === 'xs'
      ? 'w-3 h-3'
      : size === 'sm'
      ? 'w-3.5 h-3.5'
      : size === 'icon'
      ? 'w-4 h-4'
      : 'w-4 h-4';
  const resolvedIconClass = iconClassName || defaultIconSize;

  const content = (
    <>
      {LeftIcon && <LeftIcon className={resolvedIconClass} />}
      {children}
      {RightIcon && <RightIcon className={resolvedIconClass} />}
    </>
  );

  if (as === 'a') {
    const anchorProps = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a className={classes} {...anchorProps}>
        {content}
      </a>
    );
  }

  if (as === 'label') {
    const labelProps = rest as React.LabelHTMLAttributes<HTMLLabelElement>;
    return (
      <label className={classes} {...labelProps}>
        {content}
      </label>
    );
  }

  const buttonProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      type={buttonProps.type || 'button'}
      className={classes}
      {...buttonProps}
    >
      {content}
    </button>
  );
};
