import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon, HelpCircleIcon } from './ui/CleanSlateIcons';
import { CleanSlateButton } from './ui/CleanSlateButton';

export interface SelectOption {
  value: string;
  label: string;
  sectionHeader?: string;
  displayGroup?: string;
  displayLabel?: string;
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
  helpText?: string;
  showHelp?: boolean;
  onHelpClick?: () => void;
}

export const FloatingSelect: React.FC<FloatingSelectProps> = ({
  label,
  value,
  onChange,
  options,
  wrapperClassName = '',
  className = '',
  disabled = false,
  required: _required = false,
  name,
  id,
  helpText,
  showHelp = false,
  onHelpClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasHelpIcon = Boolean(helpText || showHelp || onHelpClick);

  const selectedOption = options.find((opt) => opt.value === value);
  const hasValue = value !== undefined && value !== null && value !== '';
  const isFloating = isOpen || hasValue;

  const activeTopLabel =
    selectedOption && selectedOption.displayGroup && !isOpen
      ? selectedOption.displayGroup
      : label;

  const activeBottomText = selectedOption
    ? selectedOption.displayLabel || selectedOption.label
    : '';

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

  const hasSectionHeaders = options.some((opt) => Boolean(opt.sectionHeader));

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
            fontWeight: 400,
            color: '#101010'
          }}
          className={`w-full text-left bg-white border border-[#2d2d2d] rounded-xl text-xs sm:text-sm font-normal text-[#101010] min-h-[52px] truncate transition-all shadow-[0_2px_0_rgba(0,0,0,0.22)] focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] cursor-pointer flex items-center justify-between pr-9 ${
            isFloating ? 'pt-5 pb-1.5 px-3.5' : 'py-3.5 px-3.5'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
        >
          <span className="truncate text-[#101010]">
            {activeBottomText}
          </span>
        </button>

        {/* Floating Label */}
        <label
          title={activeTopLabel}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`absolute pointer-events-none transition-all duration-150 select-none truncate ${
            isFloating 
              ? 'top-2 left-3.5 right-8 text-[10px] leading-tight font-bold italic text-[#5e646b]' 
              : 'top-4 left-3.5 right-8 text-xs sm:text-sm text-[#767676] italic font-light'
          }`}
          style={{
            fontFamily: "'Google Sans Flex', sans-serif"
          }}
        >
          {activeTopLabel}
        </label>

        {/* Chevron Indicator */}
        <div 
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-150 text-slate-600 ${
            isOpen ? 'rotate-180 text-[#8c93fc]' : ''
          }`}
        >
          <ChevronDownIcon className="w-4 h-4" />
        </div>

        {/* Custom Popover Dropdown Card */}
        {isOpen && (
          <div
            className="absolute left-0 right-0 min-w-[280px] top-full mt-2 z-50 bg-white border border-[#2d2d2d]/20 rounded-[22px] p-3 shadow-[0_14px_36px_rgba(0,0,0,0.20)] max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
            style={{
              fontFamily: "'Google Sans Flex', sans-serif"
            }}
          >
            <div className={hasSectionHeaders ? 'space-y-0.5' : 'space-y-0.5'}>
              {options.map((opt, index) => {
                const isSelected = opt.value === value;
                const prevSection = index > 0 ? options[index - 1].sectionHeader : undefined;
                const showSectionHeader =
                  opt.sectionHeader && opt.sectionHeader !== prevSection;

                return (
                  <React.Fragment key={opt.value}>
                    {showSectionHeader && (
                      <div
                        className={`px-2.5 pb-1 text-[10px] font-bold tracking-wider uppercase text-[#eb5e73] select-none ${
                          index === 0 ? 'pt-1' : 'pt-4'
                        }`}
                      >
                        {opt.sectionHeader}
                      </div>
                    )}
                    {!showSectionHeader && opt.hasDividerAbove && (
                      <div className="my-1.5 border-t border-slate-100" />
                    )}
                    <div
                      onClick={() => handleSelectOption(opt.value)}
                      className={`w-full text-left rounded-xl flex items-center justify-between gap-3 transition cursor-pointer select-none ${
                        hasSectionHeaders ? 'pl-5 pr-3 py-1.5' : 'px-3.5 py-2.5'
                      } ${
                        isSelected
                          ? 'bg-[#8c93fc]/15 text-[#101010] font-semibold'
                          : 'hover:bg-slate-100/80 text-[#101010] font-normal'
                      }`}
                    >
                      <span className="truncate block text-xs sm:text-[13px] text-[#101010]">
                        {opt.displayLabel || opt.label}
                      </span>
                      {isSelected && (
                        <CheckIcon className="w-3.5 h-3.5 text-[#8c93fc] shrink-0" />
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {hasHelpIcon && (
        <div className="relative shrink-0">
          <CleanSlateButton
            variant="periwinkle"
            size="icon"
            onClick={onHelpClick}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            className="!p-1.5 cursor-help"
            aria-label={`Help information for ${label}`}
            title={helpText || 'Help information'}
          >
            <HelpCircleIcon className="w-4 h-4" />
          </CleanSlateButton>
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
