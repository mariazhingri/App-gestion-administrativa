import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { getAllSales, type SaleListItem } from '@/services/sales.service';

const statusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Activo', value: 'A' },
  { label: 'Inactiva', value: 'I' },
  { label: 'Cancelada', value: 'E' },
];

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

function getSaleNumber(id: number) {
  return `V-${String(id).padStart(6, '0')}`;
}

function getStatusLabel(status: SaleListItem['status']) {
  if (status === 'I') return 'Inactiva';
  if (status === 'E') return 'Cancelada';
  return 'Activo';
}

export default function ConsultScreen() {
  const insets = useSafeAreaInsets();
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [client, setClient] = useState('');
  const [status, setStatus] = useState('');
  const [appliedFilters, setAppliedFilters] = useState(() => ({
    search: '',
    fromDate: '',
    toDate: '',
    client: '',
    status: '',
  }));
  const [openFilter, setOpenFilter] = useState<'client' | 'status' | null>(null);

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

  const clients = useMemo(
    () => [...new Map(sales.map((sale) => [sale.cliente_id, sale.clientes.nombre_completo])).entries()]
      .map(([id, name]) => ({ label: name, value: String(id) })),
    [sales],
  );
  const filteredSales = useMemo(() => {
    const normalizedSearch = appliedFilters.search.trim().toLocaleLowerCase();
    return sales.filter((sale) => {
      const matchesSearch = !normalizedSearch
        || getSaleNumber(sale.id).toLocaleLowerCase().includes(normalizedSearch)
        || sale.clientes.nombre_completo.toLocaleLowerCase().includes(normalizedSearch);
      const saleDate = getSaleDate(sale.fecha_emision);
      return matchesSearch
        && (!appliedFilters.fromDate || saleDate >= appliedFilters.fromDate)
        && (!appliedFilters.toDate || saleDate <= appliedFilters.toDate)
        && (!appliedFilters.client || String(sale.cliente_id) === appliedFilters.client)
        && (!appliedFilters.status || sale.status === appliedFilters.status);
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
      search,
      fromDate,
      toDate,
      client,
      status,
    });
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
          <Text style={styles.label}>BUSCAR VENTA O CLIENTE</Text>
          <TextInput
            accessibilityLabel="Buscar venta o cliente"
            autoCapitalize="none"
            onChangeText={setSearch}
            onSubmitEditing={applyFilters}
            placeholder="Ej. V-000012 o María López"
            placeholderTextColor={Palette.sale.placeholder}
            returnKeyType="search"
            style={styles.input}
            value={search}
          />
          <View style={styles.twoColumn}>
            <SalesDateFilter label="FECHA DESDE" value={fromDate} onChange={setFromDate} />
            <SalesDateFilter label="FECHA HASTA" value={toDate} onChange={setToDate} />
          </View>
          <View style={styles.twoColumn}>
            <FilterDropdown
              label="CLIENTE"
              value={client}
              placeholder="Todos los clientes"
              options={[{ label: 'Todos los clientes', value: '' }, ...clients]}
              isOpen={openFilter === 'client'}
              onToggle={() => setOpenFilter(openFilter === 'client' ? null : 'client')}
              onSelect={(value) => {
                setClient(value);
                setOpenFilter(null);
              }}
            />
            <FilterDropdown
              label="ESTADO"
              value={status}
              placeholder="Todos"
              options={statusOptions}
              isOpen={openFilter === 'status'}
              onToggle={() => setOpenFilter(openFilter === 'status' ? null : 'status')}
              onSelect={(value) => {
                setStatus(value);
                setOpenFilter(null);
              }}
            />
          </View>
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
            <Pressable
              key={sale.id}
              accessibilityRole="button"
              accessibilityLabel={`Abrir venta ${getSaleNumber(sale.id)} de ${sale.clientes.nombre_completo}`}
              onPress={() => router.push({
                pathname: '/venta/[id]',
                params: { id: String(sale.id) },
              })}
              style={({ pressed }) => [styles.saleCard, pressed && styles.pressed]}>
              <View style={styles.saleIcon}>
                <Text style={styles.saleIconText}>▤</Text>
              </View>
              <View style={styles.saleMain}>
                <View style={styles.saleTop}>
                  <Text style={styles.saleNumber}>{getSaleNumber(sale.id)}</Text>
                  <Text style={styles.saleAmount}>{formatMoney(sale.total)}</Text>
                </View>
                <Text numberOfLines={1} style={styles.customerName}>
                  {sale.clientes.nombre_completo}
                </Text>
                <View style={styles.saleBottom}>
                  <Text style={styles.saleDate}>{formatDate(sale.fecha_emision)}</Text>
                  <StatusBadge status={sale.status} />
                </View>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function FilterDropdown({
  label,
  value,
  placeholder,
  options,
  isOpen,
  onToggle,
  onSelect,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: { label: string; value: string }[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? placeholder;
  return (
    <View style={styles.dropdownField}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={onToggle}
        style={styles.dropdownButton}>
        <Text numberOfLines={1} style={styles.dropdownText}>{selectedLabel}</Text>
        <Text style={styles.dropdownArrow}>⌄</Text>
      </Pressable>
      {isOpen && (
        <View style={styles.dropdownOptions}>
          {options.map((option) => (
            <Pressable
              key={`${label}-${option.value || 'all'}`}
              accessibilityRole="button"
              onPress={() => onSelect(option.value)}
              style={styles.dropdownOption}>
              <Text style={styles.dropdownOptionText}>{option.label}</Text>
            </Pressable>
          ))}
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
  input: {
    minHeight: 44, borderWidth: 1, borderColor: '#DCE5EF', borderRadius: 10,
    paddingHorizontal: 12, color: '#283B55', fontSize: 13, marginBottom: 12,
  },
  twoColumn: { flexDirection: 'row', gap: 10 },
  dropdownField: { flex: 1, minWidth: 0, marginBottom: 12 },
  dropdownButton: {
    minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 5, borderWidth: 1, borderColor: '#DCE5EF', borderRadius: 10, paddingHorizontal: 10,
  },
  dropdownText: { flex: 1, color: '#283B55', fontSize: 12 },
  dropdownArrow: { color: '#607B9F', fontSize: 17 },
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
    borderBottomColor: '#EDF1F6' 
  },
  
  dropdownOptionText: { 
    color: '#283B55', 
    fontSize: 12 },

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
    flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3EBF5',
    borderRadius: 14, padding: 13, marginBottom: 10,
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
  loading: { marginTop: 28 },
  messagePanel: { alignItems: 'center', padding: 28, backgroundColor: '#FFFFFF', borderRadius: 14 },
  errorText: { color: Palette.sale.error, fontSize: 13, textAlign: 'center', marginBottom: 12 },
  retryText: { color: '#1769EE', fontSize: 13, fontWeight: '700' },
  emptyText: { color: '#8290A3', fontSize: 13, textAlign: 'center' },
});
