import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';
import { Typography, Spacer } from './UI';
export { Spacer };

export const Input = ({ label, placeholder, value, onChangeText, secureTextEntry, ...props }) => (
  <View style={styles.group}>
    {label && <Typography variant="label">{label}</Typography>}
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.t4}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      autoCapitalize="none"
      {...props}
    />
  </View>
);


const styles = StyleSheet.create({
  group: {
    marginBottom: 18,
  },
  input: {
    backgroundColor: theme.colors.card2,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.r2,
    padding: 12,
    fontSize: 14,
    color: theme.colors.t1,
  }
});
