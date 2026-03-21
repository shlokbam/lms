import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TextInput } from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Card, Spacer, PremiumLoading } from '../../components/UI';
import { Users, Search, Mail, Book, GraduationCap } from 'lucide-react-native';
import api from '../../api/api';

export default function Trainees() {
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTrainees();
  }, []);

  const fetchTrainees = async () => {
    try {
      const res = await api.get('/api/trainer/trainees');
      setTrainees(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filtered = trainees.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <PremiumLoading message="Syncing Trainee Data..." />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h1" style={{ marginBottom: 16 }}>Trainees</Typography>
        <View style={styles.searchContainer}>
          <Search size={18} color={theme.colors.t4} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search by name or email..."
            placeholderTextColor={theme.colors.t4}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTrainees(); }} tintColor={theme.colors.acc} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Typography variant="body" style={{ color: theme.colors.t4 }}>No trainees found.</Typography>
          </View>
        ) : (
          filtered.map(t => (
            <Card key={t.id} style={styles.traineeCard}>
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Typography style={{ color: '#fff', fontWeight: 'bold' }}>{t.name[0]}</Typography>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Typography variant="h3" style={{ marginBottom: 2 }}>{t.name}</Typography>
                  <View style={styles.metaRow}>
                    <Mail size={12} color={theme.colors.t4} />
                    <Typography variant="small" style={{ color: theme.colors.t3, marginLeft: 4 }}>{t.email}</Typography>
                  </View>
                </View>
              </View>

              <Spacer h={16} />
              <View style={styles.divider} />
              <Spacer h={16} />

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Book size={16} color={theme.colors.acc} />
                  <Typography variant="h3" style={{ marginBottom: 0, marginTop: 4 }}>{t.enrolled || 0}</Typography>
                  <Typography variant="small" style={{ color: theme.colors.t4 }}>Courses</Typography>
                </View>
                <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: theme.colors.border }]}>
                  <GraduationCap size={16} color={theme.colors.green} />
                  <Typography variant="h3" style={{ marginBottom: 0, marginTop: 4 }}>{t.attempts || 0}</Typography>
                  <Typography variant="small" style={{ color: theme.colors.t4 }}>Tests Taken</Typography>
                </View>
              </View>
            </Card>
          ))
        )}
        <Spacer h={40} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.colors.card, 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  searchInput: { flex: 1, marginLeft: 10, color: theme.colors.t1, fontSize: 16 },
  scroll: { padding: 24 },
  empty: { padding: 60, alignItems: 'center' },
  traineeCard: { padding: 16, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.card2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1, backgroundColor: theme.colors.border, opacity: 0.5 },
  statsRow: { flexDirection: 'row' },
  statBox: { flex: 1, alignItems: 'center' }
});
