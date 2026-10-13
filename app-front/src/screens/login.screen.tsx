import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Palette } from '@/constants/colors';
import { getAuthToken, login } from '@/services/auth.service';

export default function LoginScreen() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    getAuthToken()
      .then((token) => {
        if (isCurrent && token) router.replace('/registrar');
      })
      .catch((sessionError: unknown) => {
        if (isCurrent) {
          setError(
            sessionError instanceof Error
              ? sessionError.message
              : 'No se pudo recuperar la sesión.',
          );
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleLogin = async () => {
    if (!password.trim()) {
      setError('Ingresa la contraseña para continuar.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await login(password);
      router.replace('/registrar');
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : 'No se pudo iniciar sesión.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.form}>
        <Text style={styles.brand}>Pepe&apos;s Costillas</Text>
        <TextInput
          accessibilityLabel="Contraseña"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setPassword}
          onSubmitEditing={() => void handleLogin()}
          placeholder="Contraseña"
          placeholderTextColor={Palette.sale.placeholder}
          returnKeyType="go"
          secureTextEntry
          style={styles.input}
          value={password}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={isLoading}
          onPress={() => void handleLogin()}
          style={({ pressed }) => [
            styles.button,
            pressed && !isLoading && styles.buttonPressed,
            isLoading && styles.buttonDisabled,
          ]}>
          <Text style={styles.buttonText}>Acceder</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: Palette.sale.screen,
  },
  form: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    gap: 16,
  },
  brand: {
    color: Palette.coffee.sidebar,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: Palette.sale.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: Palette.sale.white,
    color: Palette.sale.text,
    fontSize: 16,
  },
  error: {
    color: Palette.sale.error,
    fontSize: 14,
  },
  button: {
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Palette.sale.accent,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Palette.sale.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
