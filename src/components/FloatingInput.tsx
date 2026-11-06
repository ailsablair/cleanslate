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
          className={`absolute left-3.5 transition-all duration-150 pointer-events-none font-light text-slate-500 select-none ${
            isFloating ? 'top-4 text-xs' : 'top-3.5 text-xs text-[#767676]'
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
        className={`w-full bg-white border border-slate-300 rounded-xl text-xs font-light text-[#101010] min-h-[44px] truncate transition-all focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] focus:border-transparent ${
          isFloating ? 'pt-4.5 pb-1' : 'py-3.5'
        } ${prefix ? 'pl-7 pr-3' : 'px-3.5'} ${className}`}
        {...rest}
      />
      <label
        title={label}
        className={`absolute pointer-events-none transition-all duration-150 select-none truncate ${
          isFloating 
            ? 'top-1.5 left-3.5 right-3 text-[8.5px] leading-tight font-semibold text-[#666666] uppercase tracking-wider not-italic' 
            : prefix 
              ? 'top-3.5 left-7 right-3 text-xs text-[#767676] italic font-light' 
              : 'top-3.5 left-3.5 right-3 text-xs text-[#767676] italic font-light'
        }`}
        style={{
          fontFamily: "'Google Sans Flex', sans-serif"
        }}
      >
        {label}
      </label>
    </div>
  );
};
