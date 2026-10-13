import { router, usePathname } from 'expo-router';
import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/colors';
import { logout } from '@/services/auth.service';

export default function AppTabs() {
  const pathname = usePathname();
  const isLoginScreen = pathname === '/';
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const sidebarWidth = getSidebarWidth(width);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      Alert.alert('No se pudo cerrar sesión', 'Inténtalo de nuevo.');
    }
  };

  return (
    <Tabs>
      <TabSlot style={styles.tabSlot} />
      {isSidebarOpen && !isLoginScreen && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar menú"
          onPress={() => setIsSidebarOpen(false)}
          style={styles.outsideDismiss}
        />
      )}
      <TabList asChild>
        <Sidebar
          isOpen={isSidebarOpen && !isLoginScreen}
          onLogout={() => void handleLogout()}
          sidebarWidth={sidebarWidth}>
          <TabTrigger name="login" href="/" asChild>
            <Pressable style={styles.hiddenLoginTrigger} />
          </TabTrigger>
          <TabTrigger name="detalle-venta" href="/venta/[id]" asChild>
            <Pressable style={styles.hiddenLoginTrigger} />
          </TabTrigger>
          <TabTrigger name="registrar" href="/registrar" asChild>
            <SidebarButton label="Registrar" />
          </TabTrigger>
          <TabTrigger name="consultar" href="/consultar" asChild>
            <SidebarButton label="Consultar" />
          </TabTrigger>
        </Sidebar>
      </TabList>
      {!isSidebarOpen && !isLoginScreen && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir menú"
          onPress={() => setIsSidebarOpen(true)}
          style={[
            styles.menuToggle,
            {
              left: insets.left + 12,
              top: insets.top + 12,
            },
          ]}>
          <View style={styles.menuBars}>
            <View style={styles.menuBar} />
            <View style={styles.menuBar} />
            <View style={styles.menuBar} />
          </View>
        </Pressable>
      )}
    </Tabs>
  );
}

type SidebarProps = React.ComponentProps<typeof View> & {
  isOpen: boolean;
  onLogout: () => void;
  sidebarWidth: number;
};

function Sidebar({ children, isOpen, onLogout, sidebarWidth, ...props }: SidebarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      {...props}
      style={[
        props.style,
        styles.sidebar,
        {
          width: isOpen ? sidebarWidth : 0,
          paddingLeft: isOpen ? insets.left + 16 : 0,
          paddingRight: isOpen ? insets.right + 16 : 0,
        },
      ]}>
      <View style={[styles.brandSection, { paddingTop: insets.top + 12 }]}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>LOGO</Text>
        </View>
        <Text style={styles.brandName}>Pepe&apos;s Costillas</Text>
      </View>

      <View style={styles.navigation}>{children}</View>
      <Pressable
        accessibilityRole="button"
        onPress={onLogout}
        style={({ pressed }) => [
          styles.logoutButton,
          { marginBottom: insets.bottom + 12 },
          pressed && styles.navigationButtonPressed,
        ]}>
        <Text style={styles.logoutLabel}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

function SidebarButton({ label, isFocused, ...props }: TabTriggerSlotProps & { label: string }) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.navigationButton,
        isFocused && styles.navigationButtonSelected,
        pressed && styles.navigationButtonPressed,
      ]}>
      <Text style={[styles.navigationLabel, isFocused && styles.navigationLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const MAX_SIDEBAR_WIDTH = 400;

function getSidebarWidth(windowWidth: number) {
  return Math.min(MAX_SIDEBAR_WIDTH, windowWidth * 0.7);
}

const styles = StyleSheet.create({
  tabSlot: {
    flex: 1,
    height: '100%',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: Palette.coffee.sidebar,
    zIndex: 2,
  },
  outsideDismiss: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
  },
  brandSection: {
    alignItems: 'center',
    paddingBottom: 0,
  },
  logoPlaceholder: {
    width: 92,
    height: 92,
    borderWidth: 1,
    borderColor: Palette.coffee.border,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.coffee.logoBackground,
  },
  logoText: {
    color: Palette.coffee.logoText,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  brandName: {
    marginTop: 8,
    color: Palette.coffee.brandText,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  navigation: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  logoutButton: {
    alignSelf: 'stretch',
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 'auto',
  },
  logoutLabel: {
    color: Palette.coffee.brandText,
    fontSize: 16,
    fontWeight: '600',
  },
  hiddenLoginTrigger: {
    display: 'none',
  },
  navigationButton: {
    alignSelf: 'stretch',
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  navigationButtonSelected: {
    backgroundColor: Palette.coffee.selected,
  },
  navigationButtonPressed: {
    opacity: 0.75,
  },
  navigationLabel: {
    color: Palette.coffee.navigationText,
    fontSize: 16,
    fontWeight: '600',
  },
  navigationLabelSelected: {
    color: Palette.neutral.white,
  },
  menuToggle: {
    position: 'absolute',
    zIndex: 3,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: Palette.coffee.sidebar,
  },
  menuBars: {
    gap: 5,
  },
  menuBar: {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: Palette.neutral.white,
  },
});
