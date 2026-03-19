import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { theme } from '../theme/theme';

export const Typography = ({ variant = 'body', style, children, ...props }) => {
  const getStyle = () => {
    switch (variant) {
      case 'h1': return styles.h1;
      case 'h2': return styles.h2;
      case 'h3': return styles.h3;
      case 'label': return styles.label;
      case 'caption': return styles.caption;
      case 'small': return styles.small;
      default: return styles.body;
    }
  };

  return (
    <Text style={[getStyle(), style]} {...props}>
      {children}
    </Text>
  );
};

export const Button = ({ title, onPress, variant = 'primary', style, textStyle, ...props }) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary': return styles.btnPrimary;
      case 'secondary': return styles.btnSecondary;
      case 'danger': return styles.btnDanger;
      case 'ghost': return styles.btnGhost;
      default: return styles.btnPrimary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary': return { color: theme.colors.t2 };
      case 'danger': return { color: theme.colors.red };
      case 'ghost': return { color: theme.colors.t2 };
      default: return { color: '#fff' };
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      style={[styles.btnBase, getButtonStyle(), style]} 
      onPress={onPress}
      {...props}
    >
      <Typography style={[styles.btnText, getTextStyle(), textStyle]}>
        {title}
      </Typography>
    </TouchableOpacity>
  );
};

export const Card = ({ children, style, padding = true }) => (
  <View style={[styles.card, padding && { padding: theme.spacing.md }, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  body: { fontSize: 14, color: theme.colors.t1, lineHeight: 22 },
  h1: { fontSize: 30, fontWeight: '800', color: theme.colors.t1, marginBottom: 8 },
  h2: { fontSize: 22, fontWeight: '800', color: theme.colors.t1, marginBottom: 6 },
  h3: { fontSize: 18, fontWeight: '800', color: theme.colors.t1, marginBottom: 4 },
  label: { fontSize: 12.5, fontWeight: '700', color: theme.colors.t2, textTransform: 'uppercase', marginBottom: 7 },
  caption: { fontSize: 13, color: theme.colors.t3 },
  small: { fontSize: 11, color: theme.colors.t3 },
  
  btnBase: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.roundness.r2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnPrimary: {
    backgroundColor: theme.colors.acc,
    ...theme.shadows.s1,
  },
  btnSecondary: {
    backgroundColor: theme.colors.card,
    borderWidth: 1.5,
    borderColor: theme.colors.border2,
  },
  btnDanger: {
    backgroundColor: theme.colors.redBg,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  btnGhost: {
    backgroundColor: 'transparent',
  },
  btnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.roundness.r4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.s1,
  }
});
