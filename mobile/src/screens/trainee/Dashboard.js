import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Card } from '../../components/UI';
import { Spacer } from '../../components/Form';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Bell,
  Calendar as CalIcon,
  LogOut,
  ChevronRight,
  User as UserIcon
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function TraineeDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/api/trainee/dashboard');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const StatTile = ({ label, value, icon: Icon, color }) => (
    <Card style={styles.statTile}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon size={20} color={color} />
      </View>
      <Typography variant="h2" style={{ marginBottom: 0 }}>{value}</Typography>
      <Typography variant="small">{label}</Typography>
      <View style={[styles.statBar, { backgroundColor: color }]} />
    </Card>
  );

  const ModuleCard = ({ module }) => (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={() => navigation.navigate('ModuleDetail', { moduleId: module.id })}
    >
      <Card style={styles.moduleCard} padding={false}>
        <View style={styles.mcBody}>
          <Typography variant="small" style={styles.mcCat}>{module.category}</Typography>
          <Typography variant="h3">{module.title}</Typography>
          <Typography variant="caption" numberOfLines={2}>{module.description}</Typography>
        </View>
        <View style={styles.mcFoot}>
          <View style={styles.mcMeta}>
            <Clock size={12} color={theme.colors.t3} />
            <Typography variant="small">{module.phase.toUpperCase()}</Typography>
          </View>
          <ChevronRight size={16} color={theme.colors.acc} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.acc} />}
    >
      <View style={styles.header}>
        <View>
          <Typography variant="caption">Welcome Back,</Typography>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Typography variant="h2">{user?.name}</Typography>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Calendar')} style={styles.logoutBtn}>
            <CalIcon size={20} color={theme.colors.amber} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.logoutBtn}>
            <Bell size={20} color={theme.colors.acc} />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <LogOut size={20} color={theme.colors.red} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statRow}>
        <StatTile 
          label="Total Tests" 
          value={data?.total_tests || 0} 
          icon={BookOpen} 
          color={theme.colors.acc} 
        />
        <StatTile 
          label="Tests Passed" 
          value={data?.passed_tests || 0} 
          icon={CheckCircle} 
          color={theme.colors.green} 
        />
      </View>

      <Spacer h={24} />
      
      <Typography variant="h3" style={styles.sectionTitle}>Ongoing Modules</Typography>
      {data?.ongoing?.length > 0 ? (
        data.ongoing.map(m => <ModuleCard key={m.id} module={m} />)
      ) : (
        <Typography variant="caption">No active modules at the moment.</Typography>
      )}

      <Spacer h={24} />

      <Typography variant="h3" style={styles.sectionTitle}>Upcoming</Typography>
      {data?.upcoming?.length > 0 ? (
        data.upcoming.map(m => <ModuleCard key={m.id} module={m} />)
      ) : (
        <Typography variant="caption">No upcoming modules scheduled.</Typography>
      )}

      <Spacer h={40} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: 24,
  },
  header: {
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    backgroundColor: theme.colors.card2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statTile: {
    flex: 1,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  moduleCard: {
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.acc,
  },
  mcBody: {
    padding: 16,
  },
  mcCat: {
    color: theme.colors.acc,
    fontWeight: '700',
    marginBottom: 4,
  },
  mcFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card2,
    padding: 12,
    paddingHorizontal: 16,
  },
  mcMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  }
});
