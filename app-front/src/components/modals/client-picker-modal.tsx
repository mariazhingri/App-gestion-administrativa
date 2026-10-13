import { useState } from 'react';
import {
  Modal as NativeModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Palette } from '@/constants/colors';
import type { Client } from '@/types/client';

type ClientPickerModalProps = {
  visible: boolean;
  clients: Client[];
  loading: boolean;
  error: string;
  onClose: () => void;
  onRetry: () => void;
  onSelect: (client: Client) => void;
};

export default function ClientPickerModal({
  visible,
  clients,
  loading,
  error,
  onClose,
  onRetry,
  onSelect,
}: ClientPickerModalProps) {
  const [search, setSearch] = useState('');
  const normalizedSearch = normalize(search);
  const filteredClients = clients.filter((client) =>
    normalize(client.nombre_completo).includes(normalizedSearch),
  );

  const close = () => {
    setSearch('');
    onClose();
  };

  const selectClient = (client: Client) => {
    setSearch('');
    onSelect(client);
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
            <Text style={styles.title}>Seleccionar cliente</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar selección de cliente"
              onPress={close}>
              <Text style={styles.closeButton}>×</Text>
            </Pressable>
          </View>
          <TextInput
            accessibilityLabel="Buscar cliente por nombre"
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={setSearch}
            placeholder="Buscar por nombre completo"
            placeholderTextColor={Palette.sale.placeholder}
            style={styles.searchInput}
            value={search}
          />
          {loading ? (
            <Text style={styles.message}>Cargando clientes...</Text>
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
          ) : clients.length === 0 ? (
            <Text style={styles.message}>No hay clientes disponibles.</Text>
          ) : filteredClients.length === 0 ? (
            <Text style={styles.message}>No se encontraron clientes con ese nombre.</Text>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled">
              {filteredClients.map((client) => (
                <Pressable
                  key={client.id}
                  onPress={() => selectClient(client)}
                  style={styles.option}>
                  <Text style={styles.optionText}>{client.nombre_completo}</Text>
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
  option: {
    minHeight: 48,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Palette.sale.divider,
  },
  optionText: {
    color: Palette.sale.text,
    fontSize: 14,
  },
});
