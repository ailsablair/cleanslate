import React, { useState } from 'react';

interface FloatingInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: string;
  prefix?: string;
  wrapperClassName?: string;
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
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== undefined && value !== null && value !== '';
  const isFloating = isFocused || hasValue;

  return (
    <div className={`relative w-full ${wrapperClassName}`}>
      {prefix && (
        <span
          className={`absolute left-3 transition-all duration-150 pointer-events-none font-semibold ${
            isFloating ? 'top-3.5 text-xs text-slate-500' : 'top-2.5 text-xs text-slate-400'
          }`}
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
        className={`w-full bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold truncate transition-all focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] focus:border-transparent ${
          isFloating ? 'pt-4 pb-1' : 'py-2.5'
        } ${prefix ? 'pl-7 pr-3' : 'px-3'} ${className}`}
        {...rest}
      />
      <label
        title={label}
        style={
          isFloating
            ? {
                fontSize: '9px',
                lineHeight: '10px',
                transform: 'scale(0.6)',
                transformOrigin: 'top left',
                maxWidth: 'calc(166% - 24px)',
              }
            : undefined
        }
        className={`absolute pointer-events-none transition-all duration-150 select-none truncate ${
          isFloating 
            ? 'top-1 left-3 pr-2 font-medium text-slate-400 uppercase tracking-wider' 
            : prefix 
              ? 'top-2.5 left-7 right-3 text-xs text-slate-400' 
              : 'top-2.5 left-3 right-3 text-xs text-slate-400'
        }`}
      >
        {label}
      </label>
    </div>
  );
};
