import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  Dimensions,
  TextInput,
  FlatList
} from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Card } from '../../components/UI';
import { Spacer } from '../../components/Form';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import { 
  LogOut,
  ChevronRight,
  User as UserIcon,
  Search,
  Filter,
  Layers,
  Video,
  Users,
  Eye,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Bell,
  Calendar as CalIcon,
  Clock
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function TraineeDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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
      <View>
        <Typography variant="h2" style={{ marginBottom: 0 }}>{value}</Typography>
        <Typography variant="small" style={{ color: theme.colors.t3 }}>{label}</Typography>
      </View>
      <View style={[styles.statBar, { backgroundColor: color }]} />
    </Card>
  );

  const ModuleCard = ({ module }) => {
    const isLive = module.phase === 'live';
    const isUpcoming = module.phase === 'pre';
    
    return (
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => navigation.navigate('ModuleDetail', { moduleId: module.id })}
        style={styles.cardContainer}
      >
        <Card style={styles.premiumCard} padding={false}>
          <View style={styles.pcHeader}>
            <Typography variant="small" style={styles.pcCat}>{module.category || 'GENERAL'}</Typography>
            <Typography variant="h3" numberOfLines={2} style={styles.pcTitle}>{module.title}</Typography>
            
            <View style={styles.tagRow}>
              <View style={[styles.tag, { backgroundColor: theme.colors.acc + '20' }]}>
                {module.training_type === 'virtual' ? <Video size={12} color={theme.colors.acc} /> : 
                 module.training_type === 'classroom' ? <Users size={12} color={theme.colors.acc} /> : 
                 <Layers size={12} color={theme.colors.acc} />}
                <Typography variant="caption" style={{ color: theme.colors.acc, marginLeft: 4, fontWeight: '600' }}>
                  {module.training_type === 'virtual' ? 'Virtual' : 
                   module.training_type === 'classroom' ? 'Classroom' : 'Self-paced'}
                </Typography>
              </View>
            </View>

            <View style={styles.pcDateRow}>
              <Clock size={12} color={theme.colors.t3} />
              <Typography variant="caption" style={{ marginLeft: 6, color: theme.colors.t3 }}>
                {isUpcoming ? `Starts ${new Date(module.start_datetime).toLocaleDateString()} ${new Date(module.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 
                 isLive ? `Until ${new Date(module.end_datetime).toLocaleDateString()}` : 'Ended'}
              </Typography>
            </View>
          </View>

          <View style={styles.pcFooter}>
            <View style={[styles.statusBadge, { 
              backgroundColor: isLive ? theme.colors.green + '20' : 
                               isUpcoming ? theme.colors.acc + '20' : theme.colors.card2 
            }]}>
              <View style={[styles.statusDot, { 
                backgroundColor: isLive ? theme.colors.green : 
                                 isUpcoming ? theme.colors.acc : theme.colors.t3 
              }]} />
              <Typography variant="caption" style={{ 
                color: isLive ? theme.colors.green : 
                       isUpcoming ? theme.colors.acc : theme.colors.t3, 
                fontWeight: '700' 
              }}>
                {module.phase.toUpperCase()}
              </Typography>
            </View>
            
            <TouchableOpacity 
              style={styles.previewBtn}
              onPress={() => navigation.navigate('ModuleDetail', { moduleId: module.id })}
            >
              <Typography variant="small" style={{ color: theme.colors.t1, fontWeight: '600' }}>Preview</Typography>
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const filterData = (modules) => {
    if (!modules) return [];
    return modules.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || m.training_type === typeFilter;
      return matchesSearch && matchesType;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Typography variant="caption" style={{ color: theme.colors.t3 }}>Welcome Back,</Typography>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Typography variant="h2">{user?.name}</Typography>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.iconBtn}>
            <Bell size={20} color={theme.colors.acc} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.acc} />}
      >
        <View style={styles.searchContainer}>
          <Search size={18} color={theme.colors.t3} style={styles.searchIcon} />
          <TextInput 
            style={[styles.searchInput, { color: theme.colors.t1 }]}
            placeholder="Search modules..."
            placeholderTextColor={theme.colors.t4}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {['all', 'self_paced', 'virtual', 'classroom'].map(t => (
            <TouchableOpacity 
              key={t}
              onPress={() => setTypeFilter(t)}
              style={[styles.filterChip, typeFilter === t && styles.filterChipActive]}
            >
              <Typography variant="small" style={{ color: typeFilter === t ? '#fff' : theme.colors.t3, fontWeight: '600' }}>
                {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>

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

        <Spacer h={32} />
        
        {/* Sections with Horizontal Scroll */}
        {['ongoing', 'upcoming', 'completed'].map(phaseKey => {
          if (statusFilter !== 'all' && statusFilter !== phaseKey) return null;
          
          const filtered = filterData(data?.[phaseKey]);
          if (filtered.length === 0 && !searchQuery) return null;
          
          return (
            <View key={phaseKey} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Typography variant="h3" style={{ marginBottom: 0 }}>
                  {phaseKey === 'ongoing' ? 'Live Modules' : 
                   phaseKey === 'upcoming' ? 'Upcoming' : 'Past Modules'}
                </Typography>
                <TouchableOpacity onPress={() => setStatusFilter(phaseKey)}>
                  <ArrowRight size={18} color={theme.colors.acc} />
                </TouchableOpacity>
              </View>
              
              <FlatList 
                horizontal
                data={filtered}
                renderItem={({ item }) => <ModuleCard module={item} />}
                keyExtractor={item => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={
                  <Typography variant="caption" style={{ padding: 20 }}>No modules found.</Typography>
                }
                contentContainerStyle={{ paddingRight: 20 }}
              />
              <Spacer h={24} />
            </View>
          );
        })}

        <Spacer h={60} />
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
    height: 52,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.t1,
    fontSize: 15,
  },
  filterRow: {
    marginHorizontal: 0,
    marginBottom: 24,
    paddingLeft: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.acc,
    borderColor: theme.colors.acc,
  },
  statRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
  },
  statTile: {
    flex: 1,
    padding: 16,
    paddingTop: 40,
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  statIcon: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 3,
    bottom: 0,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardContainer: {
    marginLeft: 20,
    width: width * 0.75,
  },
  premiumCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border + '50',
    overflow: 'hidden',
  },
  pcHeader: {
    padding: 20,
    paddingBottom: 16,
  },
  pcCat: {
    color: theme.colors.acc,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  pcTitle: {
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 12,
    color: theme.colors.t1,
  },
  tagRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  pcDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pcFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + '30',
    backgroundColor: theme.colors.card + '50',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  previewBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.card2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  }
});
