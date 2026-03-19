import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Card } from '../../components/UI';
import { Spacer } from '../../components/Form';
import api from '../../api/api';
import { 
  ChevronLeft, 
  Calendar as CalIcon, 
  Clock, 
  ChevronRight,
  BookOpen,
  HelpCircle
} from 'lucide-react-native';

export default function Calendar({ navigation }) {
  const [events, setEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCalendar();
  }, []);

  const fetchCalendar = async () => {
    try {
      const res = await api.get('/api/trainee/calendar');
      setEvents(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCalendar();
  };

  const fmtTime = (dt) => {
    if (!dt) return '';
    return new Date(dt).toLocaleString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const upcomingEvents = events
    .filter(e => new Date(e.start) > new Date())
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={theme.colors.t1} />
        </TouchableOpacity>
        <Typography variant="h3" style={{ marginBottom: 0 }}>Training Calendar</Typography>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.acc} />}
      >
        <Typography variant="h3" style={styles.secTitle}>Upcoming Events</Typography>
        
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((ev, i) => (
            <TouchableOpacity 
              key={i} 
              activeOpacity={0.8}
              onPress={() => ev.type === 'module' && navigation.navigate('ModuleDetail', { moduleId: ev.id })}
            >
              <Card style={[styles.evCard, { borderLeftColor: ev.type === 'module' ? (ev.color || theme.colors.acc) : theme.colors.amber }]}>
                <View style={styles.evHeader}>
                  <View style={{ flex: 1 }}>
                    <Typography variant="h3" style={{ marginBottom: 4 }}>{ev.title}</Typography>
                    <View style={styles.badgeLine}>
                      <View style={[styles.badge, { backgroundColor: ev.type === 'module' ? theme.colors.acc + '20' : theme.colors.amber + '20' }]}>
                        <Typography variant="small" style={{ color: ev.type === 'module' ? theme.colors.acc : theme.colors.amber, fontWeight: '700' }}>
                          {ev.type.toUpperCase()}
                        </Typography>
                      </View>
                    </View>
                  </View>
                  {ev.type === 'module' ? <BookOpen size={20} color={theme.colors.t4} /> : <HelpCircle size={20} color={theme.colors.t4} />}
                </View>

                <Spacer h={12} />
                
                <View style={styles.timeRow}>
                  <Clock size={14} color={theme.colors.t3} />
                  <Typography variant="small" style={{ marginLeft: 6 }}>{fmtTime(ev.start)}</Typography>
                </View>
                {ev.end && (
                  <View style={[styles.timeRow, { marginTop: 4 }]}>
                    <View style={{ width: 14 }} />
                    <Typography variant="small" style={{ marginLeft: 6, color: theme.colors.t4 }}>Ends {fmtTime(ev.end)}</Typography>
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <CalIcon size={48} color={theme.colors.card2} />
            <Spacer h={16} />
            <Typography variant="caption">No upcoming events scheduled.</Typography>
          </View>
        )}
        <Spacer h={40} />
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
  secTitle: {
    marginBottom: 16,
  },
  evCard: {
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  evHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgeLine: {
    flexDirection: 'row',
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  }
});
