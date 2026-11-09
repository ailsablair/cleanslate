import React, { useState, useRef, useEffect } from 'react';
import { LucideIcon, ChevronDown } from 'lucide-react';

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  hasDividerAbove?: boolean;
  danger?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
  className?: string;
  menuClassName?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  align = 'right',
  className = '',
  menuClassName = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="cursor-pointer inline-flex items-center"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 bg-white border border-slate-200/90 rounded-[22px] p-2 shadow-[0_12px_32px_rgba(0,0,0,0.14)] min-w-[220px] animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${menuClassName}`}
          style={{
            fontFamily: "'Google Sans Flex', sans-serif"
          }}
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={item.id || index}>
                {item.hasDividerAbove && (
                  <div className="my-1.5 border-t border-slate-100" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3.5 transition cursor-pointer select-none ${
                    item.danger
                      ? 'hover:bg-rose-50 text-rose-600 font-semibold'
                      : 'hover:bg-slate-50 text-[#101010] font-semibold'
                  }`}
                >
                  {Icon && (
                    <Icon
                      className={`w-5 h-5 shrink-0 stroke-[1.75] ${
                        item.danger ? 'text-rose-500' : 'text-[#8c93fc]'
                      }`}
                    />
                  )}
                  <span className="text-sm font-semibold text-[#101010] tracking-tight">
                    {item.label}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
