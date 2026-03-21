import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Card, Spacer, PremiumLoading, ThemedModal } from '../../components/UI';
import { ChevronLeft, GraduationCap, CheckCircle2, XCircle, Clock, Search } from 'lucide-react-native';
import api from '../../api/api';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function ModuleReports() {
  const navigation = useNavigation();
  const route = useRoute();
  const { moduleId } = route.params || {};

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTestId, setActiveTestId] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [moduleId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/trainer/module/${moduleId}/reports`);
      setData(res.data);
      if (res.data.tests.length > 0) {
        setActiveTestId(res.data.tests[0].id);
      }
    } catch (e) {
      console.error(e);
      setNotice({ title: 'Error', message: "Failed to load reports" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading || !data) return <PremiumLoading message="Generating Analytics..." />;

  const { module, tests, report_data } = data;
  const activeTest = tests.find(t => t.id === activeTestId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={theme.colors.t1} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Typography variant="h2" numberOfLines={1} style={{ marginBottom: 0 }}>Reports</Typography>
          <Typography variant="caption" style={{ color: theme.colors.t4 }}>{module.title}</Typography>
        </View>
      </View>

      <View style={styles.testSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}>
          {tests.map(t => (
            <TouchableOpacity 
              key={t.id} 
              style={[styles.testChip, activeTestId === t.id && styles.testChipActive]}
              onPress={() => setActiveTestId(t.id)}
            >
              <Typography variant="small" style={[styles.testChipText, activeTestId === t.id && styles.testChipTextActive]}>
                {t.title}
              </Typography>
            </TouchableOpacity>
          ))}
          {tests.length === 0 && (
            <Typography variant="small" style={{ color: theme.colors.t4, paddingVertical: 10 }}>No tests available for this module.</Typography>
          )}
        </ScrollView>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReports(); }} tintColor={theme.colors.acc} />}
      >
        {activeTest && (
          <Card style={styles.summaryCard}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Typography variant="h3" style={{ color: theme.colors.acc, marginBottom: 4 }}>{activeTest.title}</Typography>
                <Typography variant="small" style={{ color: theme.colors.t4 }}>{activeTest.test_type.toUpperCase()}-test • {activeTest.passing_marks}% to Pass</Typography>
              </View>
              <View style={styles.summaryStat}>
                <Typography variant="h2" style={{ color: '#fff', marginBottom: 0 }}>{report_data.filter(r => r.attempts[activeTestId]?.passed).length}</Typography>
                <Typography variant="caption" style={{ color: theme.colors.t4 }}>Passed</Typography>
              </View>
            </View>
          </Card>
        )}

        <Spacer h={20} />
        <Typography variant="h3" style={{ paddingHorizontal: 4 }}>Trainee Performance</Typography>
        <Spacer h={12} />

        {report_data.map((trainee, idx) => {
          const attempt = trainee.attempts[activeTestId];
          return (
            <Card key={trainee.id} style={styles.traineeCard}>
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Typography style={{ color: '#fff', fontWeight: 'bold' }}>{trainee.name[0]}</Typography>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Typography variant="body" style={{ fontWeight: '700' }}>{trainee.name}</Typography>
                  <Typography variant="small" style={{ color: theme.colors.t4 }}>{trainee.department || 'General'}</Typography>
                </View>
                
                {attempt ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Typography variant="h2" style={{ color: attempt.passed ? theme.colors.green : theme.colors.red, marginBottom: 0 }}>
                      {Math.round(attempt.percentage)}%
                    </Typography>
                    <View style={styles.statusRow}>
                      {attempt.passed ? <CheckCircle2 size={10} color={theme.colors.green} /> : <XCircle size={10} color={theme.colors.red} />}
                      <Typography variant="small" style={{ color: attempt.passed ? theme.colors.green : theme.colors.red, marginLeft: 4, fontSize: 10, fontWeight: '700' }}>
                        {attempt.passed ? 'PASSED' : 'FAILED'}
                      </Typography>
                    </View>
                  </View>
                ) : (
                  <View style={styles.pendingBadge}>
                    <Typography variant="small" style={{ color: theme.colors.t4, fontSize: 10 }}>NOT TAKEN</Typography>
                  </View>
                )}
              </View>
              
              {attempt && (
                <View style={styles.attemptDetails}>
                  <View style={styles.detailItem}>
                    <GraduationCap size={12} color={theme.colors.t4} />
                    <Typography variant="small" style={styles.detailText}>{attempt.score}/{attempt.total_marks} Marks</Typography>
                  </View>
                  <View style={styles.detailItem}>
                    <Clock size={12} color={theme.colors.t4} />
                    <Typography variant="small" style={styles.detailText}>
                      {new Date(attempt.submitted_at).toLocaleDateString()}
                    </Typography>
                  </View>
                </View>
              )}
            </Card>
          );
        })}

        {report_data.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Typography variant="body" style={{ color: theme.colors.t4 }}>No trainees enrolled in this module yet.</Typography>
          </View>
        )}
        
        <Spacer h={60} />
      </ScrollView>

      <ThemedModal 
        visible={!!notice}
        title={notice?.title}
        message={notice?.message}
        onConfirm={() => setNotice(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
  testSelector: { borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 16 },
  testChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border },
  testChipActive: { backgroundColor: theme.colors.acc, borderColor: theme.colors.acc },
  testChipText: { color: theme.colors.t3, fontWeight: '700' },
  testChipTextActive: { color: '#fff' },
  scroll: { padding: 24, paddingTop: 16 },
  summaryCard: { padding: 16, backgroundGradient: theme.colors.skyBg },
  row: { flexDirection: 'row', alignItems: 'center' },
  summaryStat: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 12, minWidth: 60 },
  traineeCard: { padding: 16, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.card2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  pendingBadge: { backgroundColor: theme.colors.card2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  attemptDetails: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, opacity: 0.8 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  detailText: { color: theme.colors.t3, marginLeft: 6, fontSize: 12 }
});
