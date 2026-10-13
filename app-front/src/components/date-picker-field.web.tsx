import { createElement, type ChangeEvent } from 'react';

import { Palette } from '@/constants/colors';

type DatePickerFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export default function DatePickerField({ value, onChangeText }: DatePickerFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChangeText(event.currentTarget.value);
  };

  const [year, month, day] = value.split('-');

  return createElement(
    'div',
    {
      style: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        width: '100%',
        minHeight: 44,
        border: `1px solid ${Palette.sale.inputBorder}`,
        borderRadius: 10,
        padding: '10px 12px',
        backgroundColor: Palette.sale.white,
        color: Palette.sale.text,
        fontFamily: 'inherit',
        fontSize: 14,
      },
    },
    createElement('span', null, `${day}/${month}/${year}`),
    createElement('span', { 'aria-hidden': true, style: { color: Palette.sale.secondaryText } }, '▦'),
    createElement('input', {
      type: 'date',
      'aria-label': 'Fecha de la venta',
      value,
      onChange: handleChange,
      style: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0,
        cursor: 'pointer',
      },
    }),
  );
}
