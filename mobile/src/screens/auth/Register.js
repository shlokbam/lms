import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Button } from '../../components/UI';
import { Input, Spacer } from '../../components/Form';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

export default function Register({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      await api.post('/api/auth/register', { 
        name, 
        email, 
        password,
        role: 'trainee' // Default role
      });
      Alert.alert('Success', 'Registration successful! Please login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Registration failed');
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
        <Typography variant="h1">Join Eagle LMS</Typography>
        <Typography variant="caption">Create an account to start learning</Typography>

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: { padding: 32, flexGrow: 1, justifyContent: 'center' }
});
