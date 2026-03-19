import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Button, ThemedModal } from '../../components/UI';
import { Input, Spacer } from '../../components/Form';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail } from 'lucide-react-native';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) return setNotice({ title: 'Notice', message: 'Please fill all fields' });
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      setNotice({ title: 'Login Failed', message: e.response?.data?.detail || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.brandGroup}>
          <View style={styles.logoCircle}>
            <Typography variant="h1" style={{ color: '#fff', marginBottom: 0 }}>E</Typography>
          </View>
          <Typography variant="h1" style={{ textAlign: 'center' }}>Eagle LMS</Typography>
          <Typography variant="caption" style={styles.sub}>
            Enterprise Learning Management System
          </Typography>
        </View>

        <Spacer h={32} />

        <Input
          label="Email Address"
          placeholder="email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <Input
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Spacer h={12} />
        
        <Button 
          title={loading ? "Logging in..." : "Login to Account"} 
          onPress={handleLogin}
          disabled={loading}
        />

        <Spacer h={24} />
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Typography variant="small" style={{ textAlign: 'center', color: theme.colors.acc }}>
            Don't have an account? Register here
          </Typography>
        </TouchableOpacity>
        
        <Spacer h={12} />
        <Typography variant="small" style={{ textAlign: 'center' }}>
          By logging in, you agree to our Terms of Service.
        </Typography>
      </ScrollView>

      <ThemedModal 
        visible={!!notice}
        title={notice?.title}
        message={notice?.message}
        onConfirm={() => setNotice(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scroll: {
    padding: 32,
    flexGrow: 1,
    justifyContent: 'center',
  },
  logoCircle: {
    width: 90,
    height: 90,
    backgroundColor: theme.colors.acc,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    shadowColor: theme.colors.acc,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  brandGroup: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sub: {
    textAlign: 'center',
    opacity: 0.6,
  }
});
