import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/colors';

type DatePickerFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
};

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export default function DatePickerField({ value, onChangeText }: DatePickerFieldProps) {
  const [isPickerVisible, setPickerVisible] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setPickerVisible(false);
    if (event.type === 'set' && selectedDate) {
      onChangeText(formatDate(selectedDate));
    }
  };

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Elegir fecha de venta"
        onPress={() => setPickerVisible(true)}
        style={styles.field}>
        <Text style={styles.value}>{formatDisplayDate(value)}</Text>
        <Text style={styles.calendarIcon}>▦</Text>
      </Pressable>
      {isPickerVisible && (
        <DateTimePicker
          value={parseDate(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'compact' : 'calendar'}
          onChange={handleChange}
          accentColor={Palette.sale.accent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: Palette.sale.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    color: Palette.sale.text,
    fontSize: 14,
  },
  calendarIcon: {
    color: Palette.sale.secondaryText,
    fontSize: 18,
  },
});
