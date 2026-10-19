import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/colors';
import SalesDateFilter from '@/components/sales-date-filter';
import { deleteSale, getAllSales, type SaleListItem } from '@/services/sales.service';

function formatMoney(amount: number | string) {
  return `$${Number(amount).toFixed(2)}`;
}

function getSaleDate(value: string) {
  return value.slice(0, 10);
}

function formatDate(value: string) {
  const date = getSaleDate(value);
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function getCurrentDateRange() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return {
    fromDate: `${year}-${month}-01`,
    toDate: `${year}-${month}-${day}`,
  };
}

function getSaleNumber(id: number) {
  return `V-${String(id).padStart(6, '0')}`;
}

function getStatusLabel(status: SaleListItem['status']) {
  if (status === 'I') return 'Inactiva';
  if (status === 'E') return 'Cancelada';
  return 'Activo';
}

function confirmSaleDeletion(saleNumber: string): Promise<boolean> {
  const message = `¿Eliminar la venta ${saleNumber}? Esta acción no se puede deshacer.`;
  if (Platform.OS === 'web') {
    return Promise.resolve(typeof window !== 'undefined' && window.confirm(message));
  }

  return new Promise((resolve) => {
    Alert.alert('Eliminar venta', message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

export default function ConsultScreen() {
  const insets = useSafeAreaInsets();
  const [initialDateRange] = useState(getCurrentDateRange);
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingSaleId, setDeletingSaleId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState(initialDateRange.fromDate);
  const [toDate, setToDate] = useState(initialDateRange.toDate);
  const [client, setClient] = useState('');
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(() => ({
    fromDate: initialDateRange.fromDate,
    toDate: initialDateRange.toDate,
    client: '',
  }));

  const loadSales = async () => {
    setLoading(true);
    setError('');
    try {
      const sales = await getAllSales();
      console.log('sales: ',sales);
      setSales(sales);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error inesperado al consultar ventas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSales();
  }, []);

  const handleDeleteSale = async (sale: SaleListItem) => {
    if (!await confirmSaleDeletion(getSaleNumber(sale.id))) return;

    setDeletingSaleId(sale.id);
    try {
      await deleteSale(sale.id);
      setSales((currentSales) => currentSales.filter(({ id }) => id !== sale.id));
    } catch (deleteError) {
      const message = deleteError instanceof Error
        ? deleteError.message
        : 'Error inesperado al eliminar la venta.';
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.alert(`No se pudo eliminar la venta: ${message}`);
        }
      } else {
        Alert.alert('No se pudo eliminar la venta', message);
      }
    } finally {
      setDeletingSaleId(null);
    }
  };

  const clients = useMemo(
    () => [...new Set(sales.map((sale) => sale.clientes.nombre_completo))],
    [sales],
  );
  const filteredSales = useMemo(() => {
    const normalizedClient = appliedFilters.client.trim().toLocaleLowerCase();
    return sales.filter((sale) => {
      const saleDate = getSaleDate(sale.fecha_emision);
      return (!appliedFilters.fromDate || saleDate >= appliedFilters.fromDate)
        && (!appliedFilters.toDate || saleDate <= appliedFilters.toDate)
        && (!normalizedClient || sale.clientes.nombre_completo.toLocaleLowerCase().includes(normalizedClient));
    });
  }, [sales, appliedFilters]);
  const metrics = useMemo(() => {
    const total = filteredSales.reduce((sum, sale) => sum + Number(sale.total), 0);
    return {
      amount: total,
      average: filteredSales.length ? total / filteredSales.length : 0,
    };
  }, [filteredSales]);

  const applyFilters = () => {
    setAppliedFilters({
      fromDate,
      toDate,
      client,
    });
    setClientPickerOpen(false);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
            <Text style={styles.title}>Consulta de ventas</Text>
            <Text style={styles.subtitle}>Busca y revisa las ventas registradas</Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.twoColumn}>
            <SalesDateFilter label="FECHA DESDE" value={fromDate} onChange={setFromDate} />
            <SalesDateFilter label="FECHA HASTA" value={toDate} onChange={setToDate} />
          </View>
          <ClientSearchSelect
            value={client}
            options={clients}
            isOpen={clientPickerOpen}
            onFocus={() => setClientPickerOpen(true)}
            onBlur={() => setClientPickerOpen(false)}
            onChange={(value) => {
              setClient(value);
              setClientPickerOpen(true);
            }}
            onSelect={(value) => {
              setClient(value);
              setClientPickerOpen(false);
            }}
            onSubmit={applyFilters}
          />
          <Pressable
            accessibilityRole="button"
            onPress={applyFilters}
            style={({ pressed }) => [
              styles.searchButton,
              pressed && styles.searchButtonPressed,
            ]}>
            <Text style={styles.searchButtonText}>⌕  Buscar ventas</Text>
          </Pressable>
        </View>

        <View style={styles.metrics}>
          <Metric label="Ventas encontradas" value={String(filteredSales.length)} />
          <Metric label="Monto total" value={formatMoney(metrics.amount)} />
          {/* <Metric label="Ticket promedio" value={formatMoney(metrics.average)} /> */}
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Ventas registradas</Text>
          <Text style={styles.resultCount}>{filteredSales.length} resultados</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={Palette.blue.link} style={styles.loading} />
        ) : error ? (
          <View style={styles.messagePanel}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => void loadSales()}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : filteredSales.length === 0 ? (
          <View style={styles.messagePanel}>
            <Text style={styles.emptyText}>No se encontraron ventas con esos filtros.</Text>
          </View>
        ) : (
          filteredSales.map((sale) => (
            <View
              key={sale.id}
              style={styles.saleCard}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Abrir venta ${getSaleNumber(sale.id)} de ${sale.clientes.nombre_completo}`}
                onPress={() => router.push({
                  pathname: '/venta/[id]',
                  params: { id: String(sale.id) },
                })}
                style={({ pressed }) => [styles.saleContent, pressed && styles.pressed]}>
                <View style={styles.saleIcon}>
                  <Text style={styles.saleIconText}>▤</Text>
                </View>
                <View style={styles.saleMain}>
                  <View style={styles.saleTop}>
                    <Text style={styles.saleNumber}>{getSaleNumber(sale.id)}</Text>
                  </View>
                  <Text numberOfLines={1} style={styles.customerName}>
                    {sale.clientes.nombre_completo}
                  </Text>
                  <View style={styles.saleBottom}>
                    <Text style={styles.saleDate}>{formatDate(sale.fecha_emision)}</Text>
                    {/* <StatusBadge status={sale.status} /> */}
                  </View>
                </View>
                <View>                    
                  <Text style={styles.saleAmount}>{formatMoney(sale.total)}</Text>
                </View>
                {/* <Text style={styles.arrow}>›</Text> */}
              </Pressable>
              <Pressable
                accessibilityLabel={`Eliminar venta ${getSaleNumber(sale.id)}`}
                accessibilityRole="button"
                disabled={deletingSaleId !== null}
                onPress={() => void handleDeleteSale(sale)}
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && styles.pressed,
                  deletingSaleId !== null && styles.deleteButtonDisabled,
                ]}>
                {deletingSaleId === sale.id ? (
                  <ActivityIndicator color="#C33B43" size="small" />
                ) : (
                  <SymbolView
                    name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                    size={20}
                    tintColor="#C33B43"
                  />
                )}
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function ClientSearchSelect({
  value,
  options,
  isOpen,
  onFocus,
  onBlur,
  onChange,
  onSelect,
  onSubmit,
}: {
  value: string;
  options: string[];
  isOpen: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
  onSubmit: () => void;
}) {
  const normalizedValue = value.trim().toLocaleLowerCase();
  const filteredOptions = options.filter((option) =>
    option.toLocaleLowerCase().includes(normalizedValue),
  );

  return (
    <View style={styles.dropdownField}>
      <Text style={styles.label}>CLIENTE</Text>
      <TextInput
        accessibilityLabel="Buscar cliente"
        autoCapitalize="words"
        onBlur={() => {
          setTimeout(() => {
            onBlur();
          }, 150);
        }}
        onChangeText={onChange}
        onFocus={onFocus}
        onSubmitEditing={onSubmit}
        placeholder="Todos los clientes"
        placeholderTextColor={Palette.sale.placeholder}
        returnKeyType="search"
        style={styles.clientInput}
        value={value}
      />
      {isOpen && (
        <View style={styles.dropdownOptions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onSelect('')}
            style={styles.dropdownOption}>
            <Text style={styles.dropdownOptionText}>Todos los clientes</Text>
          </Pressable>
          {filteredOptions.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              onPress={() => onSelect(option)}
              style={styles.dropdownOption}>
              <Text style={styles.dropdownOptionText}>{option}</Text>
            </Pressable>
          ))}
          {filteredOptions.length === 0 && (
            <Text style={styles.noClientOption}>No se encontraron clientes.</Text>
          )}
        </View>
      )}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: SaleListItem['status'] }) {
  const statusStyle = status === 'E'
    ? styles.cancelledBadge
    : status === 'I'
      ? styles.inactiveBadge
      : styles.normalBadge;
  return (
    <View style={[styles.statusBadge, statusStyle]}>
      <Text style={styles.statusText}>{getStatusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F5F9' },
  content: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
  },
  header: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 24,
  },
  backButton: {
    width: 42, height: 42, borderWidth: 1, borderColor: '#E3EAF2',
    borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: '#203754', fontSize: 29, lineHeight: 32 },
  title: { color: '#1D2B43', fontSize: 23, fontWeight: '700', marginBottom: 5 },
  subtitle: { color: '#7B8799', fontSize: 13 },
  panel: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4EBF4',
    borderRadius: 16, padding: 15, marginBottom: 14,
  },
  label: { color: '#65748A', fontSize: 11, fontWeight: '700', marginBottom: 7, letterSpacing: 0.3 },
  twoColumn: { flexDirection: 'row', gap: 10 },
  dropdownField: { minWidth: 0, marginBottom: 12 },
  clientInput: {
    minHeight: 44, borderWidth: 1, borderColor: '#DCE5EF', borderRadius: 10,
    paddingHorizontal: 12, color: '#283B55', fontSize: 13,
  },
  dropdownOptions: {
    position: 'absolute', zIndex: 2, top: 68, left: 0, right: 0,
    maxHeight: 180, overflow: 'scroll', borderWidth: 1, borderColor: '#DCE5EF',
    borderRadius: 10, backgroundColor: '#FFFFFF',
  },
  dropdownOption: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F6',
  },
  dropdownOptionText: { color: '#283B55', fontSize: 12 },
  noClientOption: { color: '#8290A3', fontSize: 12, padding: 10 },

  searchButton: {
    minHeight: 46, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 11, 
    backgroundColor: Palette.sale.accent,
    marginTop: 1,
  },
  searchButtonPressed: { backgroundColor: Palette.sale.accentText },
  searchButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.78 },
  metrics: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  metric: {
    flex: 1, minWidth: 0, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E5EDF6', borderRadius: 13, padding: 11,
  },
  metricLabel: { minHeight: 28, color: '#71819A', fontSize: 10, lineHeight: 14, marginBottom: 5 },
  metricValue: { color: '#203B62', fontSize: 15, fontWeight: '700' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 2, marginBottom: 11 },
  listTitle: { color: '#1D2B43', fontSize: 16, fontWeight: '700' },
  resultCount: { color: '#77869A', fontSize: 11 },
  saleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3EBF5',
    borderRadius: 14, padding: 8, marginBottom: 10,
  },
  saleContent: {
    flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 11,
    paddingVertical: 5, paddingLeft: 5,
  },
  saleIcon: {
    width: 43, height: 43, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, backgroundColor: '#EAF2FF',
  },
  saleIconText: { color: '#1769EE', fontSize: 20 },
  saleMain: { flex: 1, minWidth: 0 },
  saleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 },
  saleNumber: { color: '#203B62', fontSize: 13, fontWeight: '700' },
  saleAmount: { color: '#203B62', fontSize: 14, fontWeight: '700' },
  customerName: { color: '#53657F', fontSize: 12, marginBottom: 5 },
  saleBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  saleDate: { color: '#8592A4', fontSize: 11 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  normalBadge: { backgroundColor: '#D9F7E7' },
  inactiveBadge: { backgroundColor: '#E0EDFF' },
  cancelledBadge: { backgroundColor: '#FFE1E3' },
  statusText: { color: '#1769D8', fontSize: 10, fontWeight: '700' },
  arrow: { color: '#8DA1BC', fontSize: 22 },
  deleteButton: {
    width: 42, height: 42, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, backgroundColor: '#FFF0F0',
  },
  deleteButtonDisabled: { opacity: 0.55 },
  loading: { marginTop: 28 },
  messagePanel: { alignItems: 'center', padding: 28, backgroundColor: '#FFFFFF', borderRadius: 14 },
  errorText: { color: Palette.sale.error, fontSize: 13, textAlign: 'center', marginBottom: 12 },
  retryText: { color: '#1769EE', fontSize: 13, fontWeight: '700' },
  emptyText: { color: '#8290A3', fontSize: 13, textAlign: 'center' },
});
