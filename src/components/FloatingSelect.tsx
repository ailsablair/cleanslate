import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  hasDividerAbove?: boolean;
}

interface FloatingSelectProps {
  label: string;
  value: string;
  onChange: (e: { target: { value: string; name?: string } }) => void;
  options: SelectOption[];
  wrapperClassName?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
}

export const FloatingSelect: React.FC<FloatingSelectProps> = ({
  label,
  value,
  onChange,
  options,
  wrapperClassName = '',
  className = '',
  disabled = false,
  required = false,
  name,
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const hasValue = value !== undefined && value !== null && value !== '';
  const isFloating = isOpen || hasValue;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOption = (optValue: string) => {
    if (disabled) return;
    onChange({
      target: {
        value: optValue,
        name
      }
    });
    setIsOpen(false);
  };

  return (
    <div 
      className={`relative flex items-center gap-2.5 w-full ${wrapperClassName}`} 
      ref={containerRef}
    >
      <div className="relative flex-1 min-w-0">
        {/* Main Trigger Button */}
        <button
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          style={{
            fontFamily: "'Google Sans Flex', sans-serif",
            fontWeight: 300,
            color: '#101010'
          }}
          className={`w-full text-left bg-white border border-[#2d2d2d] rounded-xl text-sm font-light text-[#101010] min-h-[52px] truncate transition-all shadow-[0_2px_0_rgba(0,0,0,0.22)] focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] cursor-pointer flex items-center justify-between pr-9 ${
            isFloating ? 'pt-5 pb-1.5 px-3.5' : 'py-3.5 px-3.5'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
        >
          <span className="truncate text-[#101010]">
            {selectedOption ? selectedOption.label : ''}
          </span>
        </button>

        {/* Floating Label */}
        <label
          title={label}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`absolute pointer-events-none transition-all duration-150 select-none truncate ${
            isFloating 
              ? 'top-2 left-3.5 right-8 text-[10px] leading-tight font-semibold italic text-[#7a8288]' 
              : 'top-4 left-3.5 right-8 text-sm text-[#767676] italic font-light'
          }`}
          style={{
            fontFamily: "'Google Sans Flex', sans-serif"
          }}
        >
          {label}
        </label>

        {/* Chevron Indicator */}
        <div 
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-150 text-slate-600 ${
            isOpen ? 'rotate-180 text-[#8c93fc]' : ''
          }`}
        >
          <ChevronDown className="w-4 h-4 stroke-[2]" />
        </div>

        {/* Custom Popover Dropdown Card (matching dropdown_29fce253.png design) */}
        {isOpen && (
          <div
            className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-slate-200/90 rounded-[22px] p-2 shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 space-y-0.5"
            style={{
              fontFamily: "'Google Sans Flex', sans-serif"
            }}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <React.Fragment key={opt.value}>
                  {opt.hasDividerAbove && (
                    <div className="my-1.5 border-t border-slate-100" />
                  )}
                  <div
                    onClick={() => handleSelectOption(opt.value)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 transition cursor-pointer select-none text-xs ${
                      isSelected
                        ? 'bg-[#8c93fc]/15 text-[#101010] font-bold'
                        : 'hover:bg-slate-50 text-[#101010] font-semibold'
                    }`}
                  >
                    <span className="truncate text-sm font-semibold text-[#101010]">
                      {opt.label}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#8c93fc] stroke-[2.5] shrink-0" />
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
