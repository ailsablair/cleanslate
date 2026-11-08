import React, { useState } from 'react';

interface FloatingInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: string;
  prefix?: string;
  wrapperClassName?: string;
  helpText?: string;
  showHelp?: boolean;
  onHelpClick?: () => void;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  prefix,
  wrapperClassName = '',
  className = '',
  disabled,
  required,
  helpText,
  showHelp = false,
  onHelpClick,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const hasValue = value !== undefined && value !== null && value !== '';
  const isFloating = isFocused || hasValue;
  const hasHelpIcon = Boolean(helpText || showHelp || onHelpClick);

  return (
    <div className={`relative flex items-center gap-2.5 w-full ${wrapperClassName}`}>
      <div className="relative flex-1 min-w-0">
        {prefix && (
          <span
            className={`absolute left-3.5 transition-all duration-150 pointer-events-none font-light text-slate-500 select-none z-10 ${
              isFloating ? 'top-5 text-sm' : 'top-4 text-sm text-[#767676]'
            }`}
            style={{ fontFamily: "'Google Sans Flex', sans-serif", fontWeight: 300 }}
          >
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            fontFamily: "'Google Sans Flex', sans-serif",
            fontWeight: 300,
            color: '#101010'
          }}
          className={`w-full bg-white border border-[#2d2d2d] rounded-xl text-sm font-light text-[#101010] min-h-[52px] truncate transition-all shadow-[0_2px_0_rgba(0,0,0,0.22)] focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] focus:border-[#2d2d2d] ${
            isFloating ? 'pt-5 pb-1.5' : 'py-3.5'
          } ${prefix ? 'pl-7 pr-3.5' : 'px-3.5'} ${className}`}
          {...rest}
        />
        <label
          title={label}
          className={`absolute pointer-events-none transition-all duration-150 select-none truncate ${
            isFloating 
              ? 'top-2 left-3.5 right-3 text-[10px] leading-tight font-semibold italic text-[#7a8288]' 
              : prefix 
                ? 'top-4 left-7 right-3 text-sm text-[#767676] italic font-light' 
                : 'top-4 left-3.5 right-3 text-sm text-[#767676] italic font-light'
          }`}
          style={{
            fontFamily: "'Google Sans Flex', sans-serif"
          }}
        >
          {label}
        </label>
      </div>

      {/* Optional Help Question-Mark Badge Matching Design Mockup */}
      {hasHelpIcon && (
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={onHelpClick}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            className="w-6 h-6 rounded-full bg-[#9da2ea] hover:bg-[#8b91e5] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs transition active:scale-95 cursor-help select-none"
            aria-label={`Help information for ${label}`}
            title={helpText || 'Help information'}
          >
            ?
          </button>
          {helpText && showTooltip && (
            <div className="absolute right-0 bottom-full mb-2 z-50 w-64 p-2.5 rounded-xl bg-[#1d1a27] text-white text-xs shadow-xl border border-white/10 animate-in fade-in leading-relaxed pointer-events-none">
              <div className="font-semibold text-[#b6b3ff] mb-0.5">{label}</div>
              <div className="text-[11px] text-slate-300 leading-tight">{helpText}</div>
              <div className="absolute right-2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#1d1a27]" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
