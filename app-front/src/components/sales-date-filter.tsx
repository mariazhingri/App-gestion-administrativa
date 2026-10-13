import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/colors';

type SalesDateFilterProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function formatDate(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export default function SalesDateFilter({ label, value, onChange }: SalesDateFilterProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedDate = value ? new Date(`${value}T00:00:00`) : new Date();

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dateWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={value ? `${label}: ${value}` : `Seleccionar ${label.toLocaleLowerCase()}`}
          onPress={() => setPickerOpen(true)}
          style={styles.dateButton}>
          <Text style={[styles.dateText, !value && styles.placeholder]}>
            {value ? formatDate(value) : 'Todas las fechas'}
          </Text>
          <Text style={styles.dateIcon}>▦</Text>
        </Pressable>
        {!!value && (
          <Pressable accessibilityRole="button" accessibilityLabel="Limpiar fecha" onPress={() => onChange('')}>
            <Text style={styles.clearDate}>×</Text>
          </Pressable>
        )}
      </View>
      {pickerOpen && (
        <DateTimePicker
          value={Number.isNaN(selectedDate.getTime()) ? new Date() : selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'compact' : 'calendar'}
          onValueChange={(_event, selected) => {
            setPickerOpen(false);
            const year = selected.getFullYear();
            const month = String(selected.getMonth() + 1).padStart(2, '0');
            const day = String(selected.getDate()).padStart(2, '0');
            onChange(`${year}-${month}-${day}`);
          }}
          onDismiss={() => setPickerOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, minWidth: 0, marginBottom: 12 },
  label: { color: '#65748A', fontSize: 11, fontWeight: '700', marginBottom: 7, letterSpacing: 0.3 },
  dateWrap: {
    minHeight: 44, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#DCE5EF', borderRadius: 10, paddingHorizontal: 10,
  },
  dateButton: {
    flex: 1, minWidth: 0, minHeight: 42, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  dateText: { color: '#283B55', fontSize: 12 },
  placeholder: { color: Palette.sale.placeholder },
  dateIcon: { color: '#607B9F', fontSize: 16 },
  clearDate: { color: '#7B8799', fontSize: 21, paddingLeft: 8 },
});
