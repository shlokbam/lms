import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Card, Button } from '../../components/UI';
import { Spacer } from '../../components/Form';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Building, LogOut, ChevronLeft } from 'lucide-react-native';

export default function Profile({ navigation }) {
  const { user, logout } = useAuth();

  const InfoRow = ({ icon: Icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.iconBox}>
        <Icon size={18} color={theme.colors.t3} />
      </View>
      <View>
        <Typography variant="small">{label}</Typography>
        <Typography variant="body" style={{ fontWeight: '600' }}>{value || 'Not provided'}</Typography>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={theme.colors.t1} />
        </TouchableOpacity>
        <Typography variant="h3" style={{ marginBottom: 0 }}>My Profile</Typography>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Typography variant="h1" style={{ color: '#fff', marginBottom: 0 }}>
              {user?.name?.charAt(0)}
            </Typography>
          </View>
          <Spacer h={16} />
          <Typography variant="h2">{user?.name}</Typography>
          <Typography variant="caption" style={{ textTransform: 'capitalize' }}>{user?.role}</Typography>
        </View>

        <Spacer h={32} />

        <Card>
          <InfoRow icon={Mail} label="Email Address" value={user?.email} />
          <View style={styles.divider} />
          <InfoRow icon={Phone} label="Phone Number" value={user?.phone} />
          <View style={styles.divider} />
          <InfoRow icon={Building} label="Department" value={user?.department} />
        </Card>

        <Spacer h={24} />

        <Button 
          title="Logout" 
          variant="danger" 
          onPress={logout}
          style={{ marginBottom: 40 }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 15,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card2,
    borderRadius: 10,
  },
  scroll: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.s3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
  }
});
