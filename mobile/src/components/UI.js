import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';

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
    gap: 8,
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

export function Spacer({ h, w }) {
  return <View style={{ height: h || 0, width: w || 0 }} />;
}

export function Typography({ variant = 'body', style, children, ...props }) {
  const getVariantStyle = () => {
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
    <Text style={[getVariantStyle(), style]} {...props}>
      {children}
    </Text>
  );
}

export function Button({ title, onPress, variant = 'primary', icon, style, textStyle, ...props }) {
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary': return styles.btnPrimary;
      case 'secondary': return styles.btnSecondary;
      case 'danger': return styles.btnDanger;
      case 'ghost': return styles.btnGhost;
      case 'outline': return styles.btnSecondary; // Basic fallback
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
      {icon && icon}
      <Typography style={[styles.btnText, getTextStyle(), textStyle]}>
        {title}
      </Typography>
    </TouchableOpacity>
  );
}

export function Card({ children, style, padding = true }) {
  return (
    <View style={[styles.card, padding && { padding: theme.spacing.md }, style]}>
      {children}
    </View>
  );
}

export function ThemedModal({ visible, title, message, onConfirm, confirmText = "OK" }) {
  if (!visible) return null;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 30, zIndex: 9999 }]}>
      <Card style={{ alignItems: 'center', padding: 30 }}>
        {title && <Typography variant="h2" style={{ textAlign: 'center', marginBottom: 12 }}>{title}</Typography>}
        <Typography style={{ textAlign: 'center', color: theme.colors.t2, marginBottom: 24, lineHeight: 22 }}>
          {message}
        </Typography>
        <Button 
          title={confirmText} 
          onPress={onConfirm} 
          style={{ width: '100%' }}
        />
      </Card>
    </View>
  );
}

export function PremiumLoading({ message = "Loading content...", subtext = "Please wait while we prepare your experience" }) {
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
      <ActivityIndicator size="large" color={theme.colors.acc} />
      <Spacer h={24} />
      <Typography variant="h3" style={{ textAlign: 'center', opacity: 0.8 }}>{message}</Typography>
      <Typography variant="caption" style={{ textAlign: 'center', opacity: 0.6, marginTop: 8 }}>{subtext}</Typography>
    </View>
  );
}
