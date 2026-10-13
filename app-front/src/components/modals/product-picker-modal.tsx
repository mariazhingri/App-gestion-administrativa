import { Image } from 'expo-image';
import {
  Modal as NativeModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useState } from 'react';

import { Palette } from '@/constants/colors';
import type { Producto } from '@/types/product';

type ProductPickerModalProps = {
  visible: boolean;
  products: Producto[];
  loading: boolean;
  error: string;
  onClose: () => void;
  onRetry: () => void;
  onSelect: (product: Producto) => void;
};

function formatMoney(amount: number) {
  return `$${amount.toFixed(2)}`;
}

export default function ProductPickerModal({
  visible,
  products,
  loading,
  error,
  onClose,
  onRetry,
  onSelect,
}: ProductPickerModalProps) {
  const [search, setSearch] = useState('');
  const normalizedSearch = normalize(search);
  const filteredProducts = products.filter((product) =>
    normalize(product.nombre).includes(normalizedSearch),
  );

  const close = () => {
    setSearch('');
    onClose();
  };

  const selectProduct = (product: Producto) => {
    setSearch('');
    onSelect(product);
  };

  return (
    <NativeModal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Agregar productos</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar selección de productos"
              onPress={close}>
              <Text style={styles.closeButton}>×</Text>
            </Pressable>
          </View>
          <TextInput
            accessibilityLabel="Buscar producto por nombre"
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={setSearch}
            placeholder="Buscar por nombre"
            placeholderTextColor={Palette.sale.placeholder}
            style={styles.searchInput}
            value={search}
          />
          {loading ? (
            <Text style={styles.message}>Cargando productos...</Text>
          ) : error ? (
            <View>
              <Text style={styles.errorMessage}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={onRetry}
                style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </Pressable>
            </View>
          ) : products.length === 0 ? (
            <Text style={styles.message}>No hay productos disponibles.</Text>
          ) : filteredProducts.length === 0 ? (
            <Text style={styles.message}>No se encontraron productos con ese nombre.</Text>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled">
              {filteredProducts.map((product) => (
                <Pressable
                  key={product.id}
                  onPress={() => selectProduct(product)}
                  style={styles.productOption}>
                  <View style={styles.productThumb}>
                    <Image
                      contentFit="cover"
                      source={
                        product.imagen?.trim()
                          ? { uri: product.imagen }
                          : require('../../../assets/images/no-imagen.png')
                      }
                      style={styles.productImage}
                    />
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.nombre}</Text>
                    <Text style={styles.muted}>Tipo: {product.tipo}</Text>
                  </View>
                  <Text style={styles.productPrice}>
                    {formatMoney(Number(product.precio ?? 0))}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </NativeModal>
  );
}

function normalize(value: string) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Palette.sale.modalOverlay,
  },
  card: {
    width: '100%',
    maxWidth: 430,
    maxHeight: '80%',
    alignSelf: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: Palette.sale.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    color: Palette.sale.text,
    fontSize: 15,
    fontWeight: '700',
  },
  searchInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: Palette.sale.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    color: Palette.sale.text,
    fontSize: 14,
  },
  closeButton: {
    color: Palette.sale.secondaryText,
    fontSize: 28,
    lineHeight: 30,
    paddingHorizontal: 4,
  },
  message: {
    color: Palette.sale.secondaryText,
    fontSize: 14,
    paddingVertical: 16,
  },
  errorMessage: {
    color: Palette.sale.error,
    fontSize: 14,
    paddingVertical: 12,
  },
  retryButton: {
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Palette.sale.accentBackground,
  },
  retryButtonText: {
    color: Palette.sale.accentText,
    fontSize: 14,
    fontWeight: '700',
  },
  productOption: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
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
  },
  productName: {
    color: Palette.sale.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 5,
  },
  muted: {
    color: Palette.sale.mutedText,
    fontSize: 12,
  },
  productPrice: {
    color: Palette.sale.accentText,
    fontSize: 14,
    fontWeight: '700',
  },
});
