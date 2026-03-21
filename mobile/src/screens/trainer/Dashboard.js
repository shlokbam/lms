import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Card, Spacer, PremiumLoading } from '../../components/UI';
import { LayoutDashboard, Users, BookOpen, Zap, Clock, ChevronRight, Bell } from 'lucide-react-native';
import api from '../../api/api';
import { useNavigation } from '@react-navigation/native';

export default function TrainerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/api/trainer/dashboard');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading || !data) return <PremiumLoading message="Syncing Trainer Pro..." />;

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Icon size={20} color={color} />
      </View>
      <Spacer h={12} />
      <Typography variant="h1" style={{ marginBottom: 0 }}>
        <Text>{value}</Text>
      </Typography>
      <Typography variant="small" style={{ color: theme.colors.t3 }}>
        <Text>{title}</Text>
      </Typography>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Typography variant="caption" style={{ color: theme.colors.acc }}>
            <Text>Trainer Pro Dashboard</Text>
          </Typography>
          <Typography variant="h1" style={{ marginBottom: 0 }}>
            <Text>Overview</Text>
          </Typography>
        </View>
        <TouchableOpacity style={styles.notifyBtn}>
          <Bell size={22} color={theme.colors.t1} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} tintColor={theme.colors.acc} />}
      >
        <View style={styles.statsRow}>
          <StatCard title="Modules" value={data.total_modules} icon={BookOpen} color={theme.colors.acc} />
          <StatCard title="Trainees" value={data.total_trainees} icon={Users} color={theme.colors.green} />
        </View>
        <View style={[styles.statsRow, { marginTop: 12 }]}>
          <StatCard title="Live" value={data.ongoing} icon={Zap} color={theme.colors.red} />
          <StatCard title="Upcoming" value={data.upcoming} icon={Clock} color={theme.colors.info} />
        </View>

        <Spacer h={32} />
        
        <View style={styles.sectionHeader}>
          <Typography variant="h2" style={{ marginBottom: 0 }}>Recent Enrollments</Typography>
          <TouchableOpacity onPress={() => navigation.navigate('Trainees')}>
            <Typography style={{ color: theme.colors.acc }}>See All</Typography>
          </TouchableOpacity>
        </View>
        
        <Spacer h={12} />
        {data.recent.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Typography variant="caption" style={{ textAlign: 'center' }}>
              <Text>No recent activity found.</Text>
            </Typography>
          </Card>
        ) : (
          data.recent.map((item, i) => (
            <Card key={i} style={styles.activityCard}>
              <View style={styles.avatar}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{item.name[0]}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Typography variant="body" style={{ fontWeight: '700' }}>
                  <Text>{item.name}</Text>
                </Typography>
                <Typography variant="small" style={{ color: theme.colors.t3 }}>
                  <Text>Enrolled in {item.title}</Text>
                </Typography>
              </View>
              <Typography variant="small" style={{ color: theme.colors.t4 }}>
                <Text>{item.enrolled_at.slice(5, 10)}</Text>
              </Typography>
            </Card>
          ))
        )}

        <Spacer h={32} />

        <View style={styles.sectionHeader}>
          <Typography variant="h2" style={{ marginBottom: 0 }}>Your Modules</Typography>
          <TouchableOpacity onPress={() => navigation.navigate('Modules')}>
            <Typography style={{ color: theme.colors.acc }}>View List</Typography>
          </TouchableOpacity>
        </View>

        <Spacer h={12} />
        {data.modules.slice(0, 3).map((mod, i) => (
          <Card key={mod.id} style={styles.moduleSummaryCard}>
            <View style={{ flex: 1 }}>
              <Typography variant="h3" numberOfLines={1}>
                <Text>{mod.title}</Text>
              </Typography>
              <View style={styles.modMeta}>
                <Typography variant="small" style={{ color: theme.colors.t3 }}>
                  <Text>{data.mod_stats[mod.id]?.total || 0} Trainees</Text>
                </Typography>
                <View style={styles.dot} />
                <Typography variant="small" style={{ color: mod.status === 'published' ? theme.colors.green : theme.colors.t4 }}>
                  <Text>{mod.status.toUpperCase()}</Text>
                </Typography>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.t4} />
          </Card>
        ))}
        
        <Spacer h={40} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { 
    paddingTop: 60, 
    paddingBottom: 20, 
    paddingHorizontal: 24, 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  notifyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  scroll: { padding: 24 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, padding: 16 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activityCard: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.acc, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { padding: 30, backgroundColor: theme.colors.bg, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.colors.border },
  moduleSummaryCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 10 },
  modMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.t4, marginHorizontal: 8 }
});
