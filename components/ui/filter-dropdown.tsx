'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/Icon/Icon';
import styles from './filter-dropdown.module.css';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function FilterDropdown({ options, value, onChange, placeholder = 'Selecionar' }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const selectedOption = options.find((o) => o.value === value);
  const label = selectedOption?.label || placeholder;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={styles.triggerLabel}>{label}</span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>
          <Icon name="chevron-down" size={12} />
        </span>
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} aria-hidden="true" />
          <div className={styles.menu} role="listbox">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                className={`${styles.menuItem} ${opt.value === value ? styles.menuItemActive : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
