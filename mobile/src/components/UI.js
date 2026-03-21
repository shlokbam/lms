import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View, ActivityIndicator, ScrollView, Modal } from 'react-native';
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
      {typeof children === 'string' ? <Text>{children}</Text> : children}
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
      style={[
        styles.btnBase, 
        getButtonStyle(), 
        style,
        props.disabled && { opacity: 0.5 }
      ]} 
      onPress={onPress}
      {...props}
    >
      {icon && React.createElement(icon, { size: 18, color: getTextStyle().color })}
      <Text style={[styles.btnText, getTextStyle(), textStyle]}>
        {title}
      </Text>
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

export function ThemedModal({ visible, title, message, onConfirm, onClose, confirmText = "OK", confirmDisabled = false, children }) {
  if (!visible) return null;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20, zIndex: 9999 }]}>
      <Card style={{ padding: 24, maxHeight: '90%' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Typography variant="h2" style={{ marginBottom: 0 }}>
            <Text>{title}</Text>
          </Typography>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Text style={{ color: theme.colors.t3, fontSize: 20 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {message && (
          <Typography style={{ color: theme.colors.t2, marginBottom: 20, lineHeight: 20 }}>
            {message}
          </Typography>
        )}

        {children && (
          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            <View style={{ marginBottom: 24 }}>
              {children}
            </View>
          </ScrollView>
        )}
        
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {onClose && (
            <Button 
              title="Cancel" 
              variant="secondary"
              onPress={onClose} 
              style={{ flex: 1 }}
            />
          )}
          <Button 
            title={confirmText} 
            onPress={onConfirm} 
            disabled={confirmDisabled}
            style={{ flex: 2 }}
          />
        </View>
      </Card>
    </View>
  );
}

export function ThemedPicker({ label, value, items, onValueChange, placeholder = "Select..." }) {
  const [modalVisible, setModalVisible] = React.useState(false);
  const selectedItem = items.find(i => i.value === value);

  return (
    <View style={{ marginBottom: 16 }}>
      {label && <Typography variant="label">{label}</Typography>}
      <TouchableOpacity 
        style={[{
          backgroundColor: theme.colors.card2,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 10,
          height: 48,
          justifyContent: 'center',
          paddingHorizontal: 12
        }]}
        onPress={() => setModalVisible(true)}
      >
        <Typography style={{ color: value ? theme.colors.t1 : theme.colors.t4, fontSize: 14 }}>
          {selectedItem ? selectedItem.label : placeholder}
        </Typography>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 }}>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
              <Typography variant="h3">{label || 'Select Option'}</Typography>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {items.map((item, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={{ 
                    padding: 18, 
                    borderBottomWidth: idx === items.length - 1 ? 0 : 1, 
                    borderBottomColor: theme.colors.border,
                    backgroundColor: value === item.value ? theme.colors.acc + '10' : 'transparent'
                  }}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Typography style={{ 
                    color: value === item.value ? theme.colors.acc : theme.colors.t1,
                    fontWeight: value === item.value ? '700' : '500',
                    textAlign: 'center'
                  }}>
                    {item.label}
                  </Typography>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={{ padding: 18, backgroundColor: theme.colors.card2, alignItems: 'center' }}
              onPress={() => setModalVisible(false)}
            >
              <Typography style={{ fontWeight: '700', color: theme.colors.t3 }}>Cancel</Typography>
            </TouchableOpacity>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

export function PremiumLoading({ message = "Loading content...", subtext = "Please wait while we prepare your experience" }) {
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
      <ActivityIndicator size="large" color={theme.colors.acc} />
      <Spacer h={24} />
      <Typography variant="h3" style={{ textAlign: 'center', opacity: 0.8 }}>
        <Text>{message}</Text>
      </Typography>
      <Typography variant="caption" style={{ textAlign: 'center', opacity: 0.6, marginTop: 8 }}>
        <Text>{subtext}</Text>
      </Typography>
    </View>
  );
}
