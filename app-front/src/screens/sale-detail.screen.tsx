import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/colors';
import { getSaleById, type SaleDetail } from '@/services/sales.service';

function formatMoney(amount: number | string) {
  return `$${Number(amount).toFixed(2)}`;
}

function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);
  return `${formatDate(value)} · ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function getSaleNumber(id: number) {
  return `V-${String(id).padStart(6, '0')}`;
}

function getStatusLabel(status: SaleDetail['status']) {
  if (status === 'I') return 'Inactiva';
  if (status === 'E') return 'Cancelada';
  return 'Normal';
}

export default function SaleDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id: routeId } = useLocalSearchParams<{ id: string }>();
  const id = Number(routeId);
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSale = useCallback(async () => {
    if (!Number.isSafeInteger(id) || id <= 0) {
      setError('El identificador de venta no es válido.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      setSale(await getSaleById(id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error inesperado al consultar la venta.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadSale();
  }, [loadSale]);

  const units = sale?.venta_detalle.reduce(
    (sum, line) => sum + Number(line.cantidad),
    0,
  ) ?? 0;
  const discountValue = Number(sale?.descuento_valor ?? 0);

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 16,
            paddingLeft: insets.left + 64,
            paddingRight: insets.right + 18,
          },
        ]}>
        {/* <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a consulta de ventas"
          onPress={() => router.back()}
          style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable> */}
        <Text style={styles.headerTitle}>Detalle de venta</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <ActivityIndicator color={Palette.sale.accent} style={styles.loading} />
      ) : error ? (
        <View style={styles.stateMessage}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => void loadSale()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : sale ? (
        <>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: 110 + insets.bottom },
            ]}>
            <View style={styles.card}>
              <View style={styles.saleTop}>
                <View style={styles.saleIcon}>
                  <Text style={styles.saleIconText}>▤</Text>
                </View>
                <View style={styles.saleMain}>
                  <View style={styles.titleRow}>
                    <Text style={styles.saleNumber}>{getSaleNumber(sale.id)}</Text>
                    <StatusBadge status={sale.status} />
                  </View>
                  <Meta icon="▦" text={formatDateTime(sale.fecha_registro)} />
                  <Meta icon="♙" text={`Cliente: ${sale.clientes.nombre_completo}`} />
                </View>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <SummaryItem label="Subtotal" value={formatMoney(sale.subtotal)} />
              <SummaryItem label="Descuento" value={formatMoney(discountValue)} />
              <SummaryItem label="Total" value={formatMoney(sale.total)} emphasize />
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Productos</Text>
              <Text style={styles.count}>{units} {units === 1 ? 'unidad' : 'unidades'}</Text>
            </View>
            <View style={styles.card}>
              {sale.venta_detalle.map((line, index) => (
                <View
                  key={line.id}
                  style={[
                    styles.productRow,
                    index === sale.venta_detalle.length - 1 && styles.lastProductRow,
                  ]}>
                  <View style={styles.productThumb}>
                    <Image
                      contentFit="cover"
                      source={
                        line.productos.imagen?.trim()
                          ? { uri: line.productos.imagen }
                          : require('../../assets/images/no-imagen.png')
                      }
                      style={styles.productImage}
                    />
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{line.productos.nombre}</Text>
                    <Text style={styles.productCategory}>
                      {line.productos.categorias?.nombre ?? line.productos.tipo}
                    </Text>
                    <View style={styles.productMath}>
                      <Text style={styles.mathText}>{formatMoney(line.precio)}</Text>
                      <Text style={styles.mathCross}>×</Text>
                      <Text style={styles.mathText}>{Number(line.cantidad)}</Text>
                      <Text style={styles.lineSubtotal}>{formatMoney(line.subtotal)}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.paymentTitle}>Resumen de pago</Text>
              <TotalRow label="Subtotal" value={formatMoney(sale.subtotal)} />
              <TotalRow
                label={`Descuento (${sale.descuento_porcentaje}%)`}
                value={`-${formatMoney(discountValue)}`}
              />
              <TotalRow label="IVA" value={formatMoney(sale.iva)} />
              <View style={styles.finalRow}>
                <Text style={styles.finalLabel}>Total a pagar</Text>
                <Text style={styles.finalValue}>{formatMoney(sale.total)}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.observationTitle}>▤  Observaciones</Text>
              <Text style={styles.observation}>
                {sale.observacion?.trim() || 'Sin observaciones registradas.'}
              </Text>
            </View>
          </ScrollView>
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver a la consulta de ventas"
              onPress={() => router.navigate('/consultar')}
              style={({ pressed }) => [styles.backToListButton, pressed && styles.pressed]}>
              <Text style={styles.backToListText}>Volver a ventas</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );
}

function Meta({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaIcon}>{icon}</Text>
      <Text numberOfLines={2} style={styles.metaText}>{text}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: SaleDetail['status'] }) {
  const badgeStyle = status === 'E'
    ? styles.cancelledBadge
    : status === 'I'
      ? styles.inactiveBadge
      : styles.normalBadge;
  const textStyle = status === 'E'
    ? styles.cancelledText
    : status === 'I'
      ? styles.inactiveText
      : styles.normalText;

  return (
    <View style={[styles.statusBadge, badgeStyle]}>
      <Text style={[styles.statusText, textStyle]}>{getStatusLabel(status)}</Text>
    </View>
  );
}

function SummaryItem({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, emphasize && styles.summaryEmphasis]}>{value}</Text>
    </View>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.totalRow}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={styles.totalValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F6FB' },
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 14, 
    minHeight: 72,
    paddingBottom: 16, 
    backgroundColor: Palette.sale.accent,
  },
  backButton: { width: 32, height: 36, justifyContent: 'center' },
  backIcon: { color: '#FFFFFF', fontSize: 34, lineHeight: 36 },
  headerTitle: { 
    alignItems: 'center',
    flex: 1, 
    color: '#FFFFFF', 
    fontSize: 21, 
    fontWeight: '700' 
  },
  headerSpacer: { width: 20 },
  content: { width: '100%', maxWidth: 430, alignSelf: 'center', padding: 16 },
  card: {
    padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E6EDF5',
    borderRadius: 16, backgroundColor: '#FFFFFF',
  },
  saleTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 13 },
  saleIcon: {
    width: 52, height: 52, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
    borderRadius: 26, backgroundColor: '#E5EFFF',
  },
  saleIconText: { color: '#1769E8', fontSize: 25 },
  saleMain: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginVertical: 2, marginBottom: 8 },
  saleNumber: { color: '#202C3D', fontSize: 20, fontWeight: '700' },
  statusBadge: { borderRadius: 18, paddingHorizontal: 10, paddingVertical: 5 },
  normalBadge: { backgroundColor: '#D9F7E5' },
  inactiveBadge: { backgroundColor: '#E0EDFF' },
  cancelledBadge: { backgroundColor: '#FFE1E3' },
  statusText: { fontSize: 11, fontWeight: '700' },
  normalText: { color: '#167344' },
  inactiveText: { color: '#1769D8' },
  cancelledText: { color: '#C92B37' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 9, marginVertical: 5 },
  metaIcon: { width: 17, color: '#607B9F', textAlign: 'center' },
  metaText: { flex: 1, color: '#526783', fontSize: 13 },
  summaryCard: {
    flexDirection: 'row', 
    paddingVertical: 16,
     marginBottom: 14,
    borderWidth: 1, 
    borderColor: '#E6EDF5', 
    borderRadius: 16, 
    backgroundColor: '#FFFFFF',
  },
  summaryItem: { flex: 1, paddingHorizontal: 9, borderRightWidth: 1, borderRightColor: '#E6EDF5' },
  summaryLabel: { color: '#758399', fontSize: 12, marginBottom: 8 },
  summaryValue: { color: '#233957', fontSize: 16, fontWeight: '700' },
  summaryEmphasis: { 
    color: Palette.sale.money,
    fontSize: 18 
  },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 2, marginBottom: 12 },
  sectionTitle: { color: '#202C3D', fontSize: 16, fontWeight: '700' },
  count: { color: '#4F6584', fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 15, backgroundColor: '#EAF1FB' },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EDF1F6' },
  lastProductRow: { borderBottomWidth: 0, paddingBottom: 0 },
  productThumb: { width: 52, height: 52, flexShrink: 0, overflow: 'hidden', borderRadius: 12, backgroundColor: '#F1F4F8' },
  productImage: { width: '100%', height: '100%' },
  productInfo: { flex: 1, minWidth: 0 },
  productName: { color: '#202C3D', fontSize: 13, fontWeight: '700', marginBottom: 5 },
  productCategory: { color: '#758399', fontSize: 11 },
  productMath: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  mathText: { color: '#718099', fontSize: 11 },
  mathCross: { color: '#9AA6B6', fontSize: 11 },
  lineSubtotal: { color: '#233957', fontSize: 13, fontWeight: '700', marginLeft: 3 },
  paymentTitle: { color: '#202C3D', fontSize: 15, fontWeight: '700', marginBottom: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginVertical: 8 },
  totalLabel: { color: '#647287', fontSize: 13 },
  totalValue: { color: '#26354A', fontSize: 13, fontWeight: '700' },
  finalRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderTopColor: '#E6EDF5', paddingTop: 14, marginTop: 8 },
  finalLabel: { 
    color: '#202C3D', 
    fontSize: 16, 
    fontWeight: '700' },
  finalValue: { 
    color: Palette.sale.money, 
    fontSize: 22, 
    fontWeight: '700' 
  },
  observationTitle: { color: '#202C3D', fontSize: 13, fontWeight: '700', marginBottom: 9 },
  observation: { color: '#758399', fontSize: 12, lineHeight: 18 },
  bottomBar: {
    position: 'absolute', right: 0, bottom: 0, left: 0, alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 13, borderTopWidth: 1, borderTopColor: '#E6EDF5',
    backgroundColor: '#FFFFFF',
  },
  backToListButton: {
    width: '100%', 
    maxWidth: 398, 
    minHeight: 48, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 11, 
    backgroundColor: Palette.sale.accent,
  },
  backToListText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.78 },
  loading: { marginTop: 40 },
  stateMessage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: Palette.sale.error, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  retryText: { color: '#1769E8', fontSize: 14, fontWeight: '700' },
});
