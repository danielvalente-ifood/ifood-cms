'use client';

interface FilterDropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function FilterDropdown({
  label,
  value,
  onChange,
  options,
  placeholder,
}: FilterDropdownProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '8px 12px',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
