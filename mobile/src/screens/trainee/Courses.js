import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  Dimensions,
  FlatList,
  TextInput
} from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Card } from '../../components/UI';
import api from '../../api/api';
import { Search, Layers, Video, Users, Clock, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function Courses({ navigation }) {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
    fetchData();
  };

  const ModuleItem = ({ module }) => {
    const isLive = module.phase === 'live';
    const isUpcoming = module.phase === 'pre';
    
    return (
      <TouchableOpacity 
        style={styles.courseItem}
        onPress={() => navigation.navigate('ModuleDetail', { moduleId: module.id })}
      >
        <Card style={styles.courseCard}>
          <View style={styles.courseIcon}>
            {module.training_type === 'virtual' ? <Video size={20} color={theme.colors.acc} /> : 
             module.training_type === 'classroom' ? <Users size={20} color={theme.colors.acc} /> : 
             <Layers size={20} color={theme.colors.acc} />}
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="h3" style={styles.courseTitle}>{module.title}</Typography>
            <Typography variant="caption" style={{ color: theme.colors.t3 }}>
              {isUpcoming ? `Starts ${new Date(module.start_datetime).toLocaleDateString()}` : 
               isLive ? 'Ongoing now' : 'Course Ended'}
            </Typography>
          </View>
          <ChevronRight size={20} color={theme.colors.border} />
        </Card>
      </TouchableOpacity>
    );
  };

  const getFilteredModules = () => {
    if (!data) return [];
    const all = [...(data.ongoing || []), ...(data.upcoming || []), ...(data.completed || [])];
    return all.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || m.training_type === typeFilter;
      return matchesSearch && matchesType;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2">My Courses</Typography>
        <Typography variant="caption" style={{ color: theme.colors.t3 }}>
          Track your learning progress
        </Typography>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Search size={18} color={theme.colors.t3} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search courses..."
            placeholderTextColor={theme.colors.t4}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList 
        data={getFilteredModules()}
        renderItem={({ item }) => <ModuleItem module={item} />}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.acc} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Typography style={{ color: theme.colors.t3 }}>No courses found</Typography>
          </View>
        }
      />
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
  },
  searchRow: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.t1,
  },
  list: {
    padding: 24,
    paddingTop: 0,
    paddingBottom: 100,
  },
  courseItem: {
    marginBottom: 12,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  courseIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseTitle: {
    fontSize: 15,
    marginBottom: 2,
  },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
  }
});
