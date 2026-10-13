import { createElement, type ChangeEvent } from 'react';

import { Palette } from '@/constants/colors';

type SalesDateFilterProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export default function SalesDateFilter({ label, value, onChange }: SalesDateFilterProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.currentTarget.value);
  };

  return createElement(
    'label',
    {
      style: {
        display: 'block',
        flex: 1,
        minWidth: 0,
        marginBottom: 12,
        color: '#65748A',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.3,
      },
    },
    label,
    createElement('input', {
      type: 'date',
      'aria-label': label,
      value,
      onChange: handleChange,
      style: {
        display: 'block',
        boxSizing: 'border-box',
        width: '100%',
        minHeight: 44,
        marginTop: 7,
        padding: '10px',
        border: '1px solid #DCE5EF',
        borderRadius: 10,
        backgroundColor: Palette.sale.white,
        color: value ? '#283B55' : Palette.sale.placeholder,
        fontSize: 12,
        fontFamily: 'inherit',
      },
    }),
  );
}
