import { useState } from 'react';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/colors';
import DatePickerField from '@/components/date-picker-field';
import ClientPickerModal from '@/components/modals/client-picker-modal';
import ProductPickerModal from '@/components/modals/product-picker-modal';
import { getAllClients } from '@/services/clients.service';
import { getAllProducts } from '@/services/products.service';
import { createSale } from '@/services/sales.service';

import type { Client } from '@/types/client';
import type { Producto } from '@/types/product';

type SaleProduct = Omit<Producto, 'precio'> & { precio: number; quantity: number };
const TAX_RATES = [0, 8, 12, 13, 15] as const;

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidSaleDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsedDate.getTime())
    && parsedDate.toISOString().slice(0, 10) === value;
}

function formatMoney(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function roundMoney(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [date, setDate] = useState(getToday);
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [observation, setObservation] = useState('');
  const [isObservationExpanded, setObservationExpanded] = useState(false);
  const [discount, setDiscount] = useState('0');
  const [taxRate, setTaxRate] = useState<number>(15);
  const [isTaxRatePickerOpen, setTaxRatePickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [productCatalog, setProductCatalog] = useState<Producto[]>([]);
  const [isClientPickerOpen, setClientPickerOpen] = useState(false);
  const [isProductPickerOpen, setProductPickerOpen] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState('');
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState('');

  const loadClients = async () => {
    setClientLoading(true);
    setClientError('');
    try {
      const loadedClients = await getAllClients();
      setClients(loadedClients);
    } catch (err) {
      setClientError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setClientLoading(false);
    }
  };

  const loadProducts = async () => {
    setProductLoading(true);
    setProductError('');
    try {
      const loadedProducts = await getAllProducts();
      setProductCatalog(loadedProducts);
    } catch (err) {
      setProductError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setProductLoading(false);
    }
  };

  const openClientPicker = () => {
    setClientPickerOpen(true);
    void loadClients();
  };

  const openProductPicker = () => {
    setProductPickerOpen(true);
    void loadProducts();
  };

  const subtotal = roundMoney(
    products.reduce((sum, product) => sum + product.precio * product.quantity, 0),
  );
  const discountAmount = roundMoney((subtotal * Number(discount || 0)) / 100);
  const taxableAmount = roundMoney(subtotal - discountAmount);
  const taxAmount = roundMoney((taxableAmount * taxRate) / 100);
  const total = roundMoney(taxableAmount + taxAmount);
  const canSave = Boolean(
    selectedClient
    && isValidSaleDate(date)
    && products.length > 0
    && !isSaving,
  );
  const updateQuantity = (productId: number, change: number) => {
    setProducts((currentProducts) =>
      currentProducts.flatMap((product) => {
        if (product.id !== productId) return [product];
        const quantity = product.quantity + change;
        return quantity > 0 ? [{ ...product, quantity }] : [];
      }),
    );
  };
  const removeProduct = (productId: number) => {
    setProducts((currentProducts) =>
      currentProducts.filter((product) => product.id !== productId),
    );
  };
  const addProduct = (productId: number) => {
    const catalogProduct = productCatalog.find((product) => product.id === productId);
    if (!catalogProduct) return;

    setProducts((currentProducts) => {
      const existingProduct = currentProducts.find((product) => product.id === productId);
      if (existingProduct) {
        return currentProducts.map((product) =>
          product.id === productId ? { ...product, quantity: product.quantity + 1 } : product,
        );
      }
      return [
        ...currentProducts,
        { ...catalogProduct, precio: Number(catalogProduct.precio ?? 0), quantity: 1 },
      ];
    });
  };
  const addVenta = async () => {
    if (!selectedClient) {
      Alert.alert('Falta seleccionar un cliente', 'Selecciona un cliente antes de continuar.');
      return;
    }
    if (!isValidSaleDate(date)) {
      Alert.alert('Falta asignar una fecha', 'Selecciona una fecha válida para la venta.');
      return;
    }
    if (!products.length) {
      Alert.alert('No hay productos', 'Agrega al menos un producto a la venta.');
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    try {
      const sale = await createSale({
        cliente_id: selectedClient.id,
        fecha_emision: date,
        observacion: observation.trim() || null,
        descuento_porcentaje: Number(discount || 0),
        iva_porcentaje: taxRate,
        productos: products.map((product) => ({
          producto_id: product.id,
          cantidad: product.quantity,
          costo_unitario: Number(product.costo),
        })),
      });
      setSelectedClient(null);
      setDate(getToday());
      setProducts([]);
      setObservation('');
      setObservationExpanded(false);
      setDiscount('0');
      setTaxRate(15);
      setTaxRatePickerOpen(false);
      Alert.alert('Venta guardada', `La venta #${sale.id} se registró correctamente.`);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Ocurrió un error inesperado al guardar la venta.';
      Alert.alert('No se pudo guardar la venta', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 120 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
            <Text style={styles.title}>Nueva venta</Text>
            <Text style={styles.subtitle}>Registra una venta de productos</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Información de la venta</Text>
            <Text style={styles.muted}>Paso 1 de 2</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>CLIENTE *</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Seleccionar cliente"
              onPress={openClientPicker}
              style={styles.select}>
              <Text style={[styles.inputText, !selectedClient && styles.placeholder]}>
                {selectedClient?.nombre_completo ?? 'Selecciona un cliente'}
              </Text>
              <Text style={styles.chevron}>⌄</Text>
            </Pressable>
          </View>
          <View>
            <Text style={styles.label}>FECHA</Text>
            <DatePickerField
              value={date}
              onChangeText={setDate}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Productos</Text>
            <Text style={styles.muted}>
              {products.length} {products.length === 1 ? 'producto' : 'productos'}
            </Text>
          </View>
          {products.length === 0 ? (
            <Text style={styles.empty}>
              Aún no has agregado productos.{'\n'}Selecciona los productos para comenzar.
            </Text>
          ) : (
            products.map((product) => (
              <View key={product.id} style={styles.productRow}>
                <View style={styles.productThumb}>
                  <Image
                    contentFit="cover"
                    source={
                      product.imagen?.trim()
                        ? { uri: product.imagen }
                        : require('../../assets/images/no-imagen.png')
                    }
                    style={styles.productImage}
                  />
                </View>
                <View style={styles.productInfo}>
                  <View style={styles.productHeader}>
                    <Text numberOfLines={2} style={styles.productName}>{product.nombre}</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar ${product.nombre} de la venta`}
                      onPress={() => removeProduct(product.id)}
                      style={({ pressed }) => [
                        styles.removeProductButton,
                        pressed && styles.pressed,
                      ]}>
                      <SymbolView
                        name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                        size={16}
                        weight="semibold"
                        tintColor={Palette.sale.error}
                      />
                    </Pressable>
                  </View>
                  <Text style={styles.price}>{formatMoney(product.precio)} por unidad</Text>
                  <View style={styles.lineBottom}>
                    <View style={styles.quantity}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Quitar una unidad de ${product.nombre}`}
                        onPress={() => updateQuantity(product.id, -1)}
                        style={styles.quantityButton}>
                        <Text style={styles.quantityButtonText}>−</Text>
                      </Pressable>
                      <Text style={styles.quantityValue}>{product.quantity}</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Agregar una unidad de ${product.nombre}`}
                        onPress={() => updateQuantity(product.id, 1)}
                        style={styles.quantityButton}>
                        <Text style={styles.quantityButtonText}>+</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.lineTotal}>
                      {formatMoney(product.precio * product.quantity)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
          <Pressable
            accessibilityRole="button"
            onPress={openProductPicker}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Text style={styles.addButtonText}>＋ Agregar productos</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatMoney(subtotal)}</Text>
          </View>
          <View style={styles.summaryControlRow}>
            <Text style={styles.summaryLabel}>Descuento (%)</Text>
            <TextInput
              accessibilityLabel="Descuento entre 1 y 100 por ciento"
              keyboardType="number-pad"
              onChangeText={(value) => {
                if (value === '') {
                  setDiscount('');
                  return;
                }

                if (!/^\d{1,3}$/.test(value)) return;

                const percentage = Number(value);
                if (percentage >= 1 && percentage <= 100) {
                  setDiscount(String(percentage));
                }
              }}
              maxLength={3}
              style={styles.summaryInput}
              value={discount}
            />
            <Text style={styles.summaryValue}>-{formatMoney(discountAmount)}</Text>
          </View>
          <View style={styles.summaryControlRow}>
            <Text style={styles.summaryLabel}>IVA</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Porcentaje de IVA: ${taxRate}%`}
              accessibilityState={{ expanded: isTaxRatePickerOpen }}
              onPress={() => setTaxRatePickerOpen((isOpen) => !isOpen)}
              style={styles.taxSelect}>
              <Text style={styles.inputText}>{taxRate}%</Text>
              <Text style={styles.chevron}>⌄</Text>
            </Pressable>
            <Text style={styles.summaryValue}>{formatMoney(taxAmount)}</Text>
          </View>
          {isTaxRatePickerOpen && (
            <View style={styles.taxOptions}>
              {TAX_RATES.map((rate) => (
                <Pressable
                  key={rate}
                  accessibilityRole="button"
                  accessibilityState={{ selected: taxRate === rate }}
                  onPress={() => {
                    setTaxRate(rate);
                    setTaxRatePickerOpen(false);
                  }}
                  style={[
                    styles.taxOption,
                    taxRate === rate && styles.selectedTaxOption,
                  ]}>
                  <Text
                    style={[
                      styles.taxOptionText,
                      taxRate === rate && styles.selectedTaxOptionText,
                    ]}>
                    {rate}%
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalLabel}>{formatMoney(total)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: isObservationExpanded }}
            onPress={() => setObservationExpanded((isExpanded) => !isExpanded)}
            style={styles.observationHeader}>
            <Text style={styles.sectionTitle}>Observación</Text>
            <Text style={styles.chevron}>{isObservationExpanded ? '⌃' : '⌄'}</Text>
          </Pressable>
          {isObservationExpanded && (
            <View>
              <TextInput
                accessibilityLabel="Observación de la venta, máximo 250 caracteres"
                maxLength={250}
                multiline
                onChangeText={setObservation}
                placeholder="Escribe una observación (opcional)"
                placeholderTextColor={Palette.sale.placeholder}
                style={styles.observationInput}
                textAlignVertical="top"
                value={observation}
              />
              <Text style={styles.observationCount}>{observation.length}/250</Text>
            </View>
          )}
        </View>

      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: 14 + insets.bottom }]}>
        <Pressable
          accessibilityRole="button"
          onPress={addVenta}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.primaryButton,
            !canSave && styles.disabledButton,
            pressed && canSave && styles.pressed,
          ]}>
          <Text style={styles.primaryButtonText}>
            {isSaving ? 'Guardando...' : 'Guardar venta'}
          </Text>
        </Pressable>
      </View>

      <ClientPickerModal
        visible={isClientPickerOpen}
        clients={clients}
        loading={clientLoading}
        error={clientError}
        onClose={() => setClientPickerOpen(false)}
        onRetry={() => void loadClients()}
        onSelect={(client) => {
          setSelectedClient(client);
          setClientPickerOpen(false);
        }}
      />
      <ProductPickerModal
        visible={isProductPickerOpen}
        products={productCatalog}
        loading={productLoading}
        error={productError}
        onClose={() => setProductPickerOpen(false)}
        onRetry={() => void loadProducts()}
        onSelect={(product) => addProduct(product.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.sale.background,
  },
  content: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: Palette.sale.screen,
  },
  header: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 24,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.sale.white,
    borderWidth: 1,
    borderColor: Palette.sale.border,
  },
  headerIconText: {
    color: Palette.sale.accent,
    fontSize: 25,
    lineHeight: 29,
  },
  title: {
    color: Palette.sale.text,
    fontSize: 23,
    fontWeight: '700',
    marginBottom: 5,
  },
  subtitle: {
    color: Palette.sale.secondaryText,
    fontSize: 13,
  },
  section: {
    backgroundColor: Palette.sale.white,
    borderWidth: 1,
    borderColor: Palette.sale.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    color: Palette.sale.text,
    fontSize: 15,
    fontWeight: '700',
  },
  observationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  observationInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: Palette.sale.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Palette.sale.text,
    fontSize: 14,
    marginTop: 14,
  },
  observationCount: {
    color: Palette.sale.secondaryText,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 5,
  },
  muted: {
    color: Palette.sale.mutedText,
    fontSize: 12,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: Palette.sale.label,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  select: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: Palette.sale.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: Palette.sale.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Palette.sale.text,
  },
  inputText: {
    color: Palette.sale.text,
    fontSize: 14,
  },
  placeholder: {
    color: Palette.sale.placeholder,
  },
  chevron: {
    color: Palette.sale.secondaryText,
    fontSize: 18,
  },
  empty: {
    color: Palette.sale.placeholder,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    paddingVertical: 22,
    paddingHorizontal: 8,
  },
  productRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Palette.sale.divider,
  },
  productThumb: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: Palette.sale.productBackground,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  productName: {
    flex: 1,
    minWidth: 0,
    color: Palette.sale.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  removeProductButton: {
    width: 36,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FDECEC',
  },
  price: {
    color: Palette.sale.secondaryText,
    fontSize: 12,
  },
  lineBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
  },
  quantity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: Palette.sale.inputBorder,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    color: Palette.sale.label,
    fontSize: 17,
    lineHeight: 20,
  },
  quantityValue: {
    color: Palette.sale.text,
    fontSize: 13,
    fontWeight: '700',
  },
  lineTotal: {
    color: Palette.sale.text,
    fontSize: 14,
    fontWeight: '700',
  },
  addButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Palette.sale.accentBorder,
    backgroundColor: Palette.sale.accentBackground,
    borderRadius: 11,
    marginTop: 14,
  },
  addButtonText: {
    color: Palette.sale.accentText,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  summaryControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  summaryLabel: {
    color: Palette.sale.summaryText,
    fontSize: 13,
    flex: 1,
  },
  summaryInput: {
    width: 62,
    minHeight: 38,
    borderWidth: 1,
    borderColor: Palette.sale.inputBorder,
    borderRadius: 9,
    paddingHorizontal: 8,
    color: Palette.sale.text,
    fontSize: 14,
    textAlign: 'center',
  },
  summaryValue: {
    minWidth: 62,
    color: Palette.sale.summaryText,
    fontSize: 13,
    textAlign: 'right',
  },
  taxSelect: {
    width: 72,
    minHeight: 38,
    borderWidth: 1,
    borderColor: Palette.sale.inputBorder,
    borderRadius: 9,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taxOptions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  taxOption: {
    minWidth: 48,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.sale.inputBorder,
    borderRadius: 9,
    backgroundColor: Palette.sale.white,
  },
  selectedTaxOption: {
    borderColor: Palette.sale.accent,
    backgroundColor: Palette.sale.accentBackground,
  },
  taxOptionText: {
    color: Palette.sale.secondaryText,
    fontSize: 13,
  },
  selectedTaxOptionText: {
    color: Palette.sale.accentText,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Palette.sale.divider,
    paddingTop: 14,
    marginTop: 14,
  },
  totalLabel: {
    color: Palette.sale.text,
    fontSize: 17,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignSelf: 'center',
    maxWidth: 430,
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: Palette.sale.white,
    borderTopWidth: 1,
    borderTopColor: Palette.sale.border,
  },
  primaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: Palette.sale.accent,
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: Palette.sale.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
