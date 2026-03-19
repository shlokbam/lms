import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Button, ThemedModal } from '../../components/UI';
import { Input, Spacer } from '../../components/Form';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

export default function Register({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) return setNotice({ title: 'Notice', message: 'Please fill all fields' });
    setLoading(true);
    try {
      await api.post('/api/auth/register', { 
        name, 
        email, 
        password,
        role: 'trainee' // Default role
      });
      setNotice({ title: 'Success', message: 'Registration successful! Please login.' });
    } catch (e) {
      setNotice({ title: 'Registration failed', message: e.response?.data?.detail || 'Something went wrong' });
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
          <Typography variant="h1" style={{ textAlign: 'center' }}>Join Eagle LMS</Typography>
          <Typography variant="caption" style={styles.sub}>Create an account to start your learning journey</Typography>
        </View>

        <Spacer h={32} />

        <Input label="Full Name" placeholder="John Doe" value={name} onChangeText={setName} />
        <Input label="Email Address" placeholder="email@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Input label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />

        <Spacer h={12} />
        <Button title={loading ? "Creating..." : "Create Account"} onPress={handleRegister} disabled={loading} />

        <Spacer h={24} />
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Typography variant="small" style={{ textAlign: 'center', color: theme.colors.acc }}>
            Already have an account? Login here
          </Typography>
        </TouchableOpacity>

        <ThemedModal 
          visible={!!notice}
          title={notice?.title}
          message={notice?.message}
          onConfirm={() => {
            setNotice(null);
            if (notice?.title === 'Success') navigation.navigate('Login');
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: { padding: 32, flexGrow: 1, justifyContent: 'center' },
  logoCircle: {
    width: 80,
    height: 80,
    backgroundColor: theme.colors.acc,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    shadowColor: theme.colors.acc,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
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
