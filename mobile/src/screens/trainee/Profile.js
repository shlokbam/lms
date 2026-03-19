import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  FlatList
} from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Card, Button } from '../../components/UI';
import { Spacer } from '../../components/Form';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  LogOut, 
  ChevronLeft,
  BookOpen,
  CheckCircle,
  TrendingUp,
  History
} from 'lucide-react-native';

export default function Profile({ navigation }) {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/trainee/profile');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const InfoRow = ({ icon: Icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.iconBox}>
        <Icon size={18} color={theme.colors.t3} />
      </View>
      <View>
        <Typography variant="small" style={{ color: theme.colors.t3 }}>{label}</Typography>
        <Typography variant="body" style={{ fontWeight: '600' }}>{value || '—'}</Typography>
      </View>
    </View>
  );

  const StatBox = ({ label, value, icon: Icon, color }) => (
    <View style={styles.statBox}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Icon size={20} color={color} />
      </View>
      <Typography variant="h2" style={styles.statValue}>{value}</Typography>
      <Typography variant="caption" style={styles.statLabel}>{label}</Typography>
    </View>
  );

  if (loading && !data) return (
    <View style={[styles.container, styles.center]}>
      <ActivityIndicator size="large" color={theme.colors.acc} />
    </View>
  );

  const { total_enrolled, total_completed, avg_score, attempts } = data;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={theme.colors.t1} />
        </TouchableOpacity>
        <Typography variant="h3" style={{ marginBottom: 0 }}>My Profile</Typography>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.acc} />}
      >
        <View style={styles.profileHero}>
          <View style={styles.avatar}>
            <Typography variant="h1" style={{ color: '#fff', marginBottom: 0 }}>
              {user?.name?.charAt(0)}
            </Typography>
          </View>
          <Spacer h={16} />
          <Typography variant="h2">{user?.name}</Typography>
          <View style={styles.roleBadge}>
            <Typography variant="small" style={{ color: theme.colors.acc, fontWeight: '700' }}>{user?.role?.toUpperCase()}</Typography>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatBox label="Courses" value={total_enrolled} icon={BookOpen} color={theme.colors.acc} />
          <StatBox label="Completed" value={total_completed} icon={CheckCircle} color={theme.colors.green} />
          <StatBox label="Avg Score" value={Math.round(avg_score) + '%'} icon={TrendingUp} color={theme.colors.amber} />
        </View>

        <Spacer h={24} />

        <Typography variant="h3" style={styles.secTitle}>Contact Information</Typography>
        <Card style={styles.infoCard}>
          <InfoRow icon={Mail} label="Email Address" value={user?.email} />
          <View style={styles.divider} />
          <InfoRow icon={Phone} label="Phone Number" value={user?.phone} />
          <View style={styles.divider} />
          <InfoRow icon={Building} label="Department" value={user?.department} />
        </Card>

        <Spacer h={32} />

        <View style={styles.historyHeader}>
          <Typography variant="h3" style={{ marginBottom: 0 }}>Test History</Typography>
          <History size={18} color={theme.colors.t3} />
        </View>
        <Spacer h={16} />
        
        {attempts?.length === 0 ? (
          <Typography variant="body" style={styles.emptyText}>No tests taken yet.</Typography>
        ) : (
          attempts?.map((att, i) => (
            <Card key={i} style={[styles.historyCard, { borderLeftColor: att.passed ? theme.colors.green : theme.colors.red }]}>
              <View style={styles.historyInfo}>
                <Typography variant="body" style={{ fontWeight: '700' }} numberOfLines={1}>{att.test_title}</Typography>
                <Typography variant="caption" style={{ color: theme.colors.t3 }}>{att.module_title}</Typography>
                <Typography variant="small" style={{ marginTop: 4, color: theme.colors.t4 }}>
                  {new Date(att.started_at).toLocaleDateString()}
                </Typography>
              </View>
              <View style={styles.historyResult}>
                <Typography variant="h3" style={{ color: att.passed ? theme.colors.green : theme.colors.red, marginBottom: 0 }}>
                  {Math.round(att.percentage)}%
                </Typography>
                <Typography variant="small" style={{ color: att.passed ? theme.colors.green : theme.colors.red, fontWeight: '700' }}>
                  {att.passed ? 'PASS' : 'FAIL'}
                </Typography>
              </View>
            </Card>
          ))
        )}

        <Spacer h={40} />
        <Button 
          title="Logout" 
          variant="danger" 
          onPress={logout}
          style={{ marginBottom: 60 }}
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card2,
    borderRadius: 12,
  },
  scroll: {
    padding: 20,
  },
  profileHero: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.colors.acc,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: theme.colors.card,
  },
  roleBadge: {
    backgroundColor: theme.colors.acc + '15',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border + '30',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    marginBottom: 0,
    fontSize: 20,
  },
  statLabel: {
    color: theme.colors.t3,
    marginTop: 2,
  },
  secTitle: {
    fontSize: 16,
    color: theme.colors.t2,
    marginBottom: 12,
  },
  infoCard: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border + '50',
    marginVertical: 12,
    marginLeft: 56,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  historyInfo: {
    flex: 1,
  },
  historyResult: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.t4,
    marginTop: 20,
  }
});
