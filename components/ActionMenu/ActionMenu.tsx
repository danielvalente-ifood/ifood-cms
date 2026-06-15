'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/Icon/Icon';
import styles from './ActionMenu.module.css';

interface ActionMenuItem {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface ActionMenuProps {
  items: ActionMenuItem[];
}

export function ActionMenu({ items }: ActionMenuProps) {
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

  const handleItemClick = (callback: () => void) => {
    callback();
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <button
        type="button"
        className={styles.trigger}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Mais opções"
      >
        <Icon name="dots-vertical" size={18} />
      </button>

      {open && (
        <>
          <div
            className={styles.backdrop}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className={styles.menu} role="menu">
            {items.map((item, idx) => (
              <button
                key={idx}
                type="button"
                role="menuitem"
                className={`${styles.menuItem} ${styles[`variant_${item.variant || 'default'}`]}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick(item.onClick);
                }}
              >
                {item.icon && <Icon name={item.icon} size={16} />}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
