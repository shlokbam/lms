import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity 
} from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Card, PremiumLoading } from '../../components/UI';
import { Spacer } from '../../components/Form';
import api from '../../api/api';
import { 
  Bell, 
  ChevronLeft, 
  Info, 
  AlertCircle,
  Clock
} from 'lucide-react-native';

export default function Notifications({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const NotificationIcon = ({ type }) => {
    switch (type) {
      case 'alert': return <AlertCircle size={20} color={theme.colors.red} />;
      case 'info': return <Info size={20} color={theme.colors.acc} />;
      default: return <Bell size={20} color={theme.colors.t3} />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={theme.colors.t1} />
        </TouchableOpacity>
        <Typography variant="h3" style={{ marginBottom: 0 }}>Notifications</Typography>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.acc} />}
      >
        {notifications.length > 0 ? (
          notifications.map(n => (
            <Card key={n.id} style={styles.notifCard}>
              <View style={styles.iconBox}>
                <NotificationIcon type={n.type} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="body" style={{ fontWeight: '700', marginBottom: 2 }}>{n.title}</Typography>
                <Typography variant="caption" style={{ marginBottom: 8 }}>{n.message}</Typography>
                <View style={styles.timeRow}>
                  <Clock size={12} color={theme.colors.t4} />
                  <Typography variant="small" style={{ color: theme.colors.t4, marginLeft: 4 }}>
                    {formatDate(n.created_at)}
                  </Typography>
                </View>
              </View>
            </Card>
          ))
        ) : (
          !loading && (
            <View style={styles.emptyState}>
              <Bell size={48} color={theme.colors.card2} />
              <Spacer h={16} />
              <Typography variant="caption">All caught up! No new notifications.</Typography>
            </View>
          )
        )}
        <Spacer h={40} />
      </ScrollView>

      {loading && !notifications.length && <PremiumLoading message="Syncing notifications..." />}
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
  notifCard: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 12,
    padding: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
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
