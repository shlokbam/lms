import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Card, Button } from '../../components/UI';
import { Spacer } from '../../components/Form';
import api from '../../api/api';
import { 
  ChevronLeft, 
  PlayCircle, 
  FileText, 
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';

export default function ModuleDetail({ route, navigation }) {
  const { moduleId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState({});

  useEffect(() => {
    fetchModule();
  }, []);

  const fetchModule = async () => {
    try {
      const res = await api.get(`/api/trainee/module/${moduleId}`);
      setData(res.data);
      // Expand all by default or first one
      const expand = {};
      res.data.chapters.forEach(c => expand[c.id] = true);
      setExpandedChapters(expand);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleChapter = (id) => {
    setExpandedChapters(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return (
    <View style={[styles.container, styles.center]}>
      <ActivityIndicator size="large" color={theme.colors.acc} />
    </View>
  );

  const MaterialRow = ({ mat }) => {
    const isDone = data.progress_map[mat.id]?.completed;
    const Icon = mat.file_type === 'video' ? PlayCircle : FileText;

    return (
      <TouchableOpacity 
        style={styles.matRow} 
        activeOpacity={0.7}
        onPress={() => navigation.navigate('DocumentViewer', { material: mat, moduleId: moduleId })}
      >
        <View style={[styles.matIcon, { backgroundColor: isDone ? theme.colors.greenBg : theme.colors.card2 }]}>
          <Icon size={18} color={isDone ? theme.colors.green : theme.colors.t3} />
        </View>
        <View style={{ flex: 1 }}>
          <Typography variant="body" style={isDone && { color: theme.colors.t3 }}>{mat.title}</Typography>
          <Typography variant="small" style={{ textTransform: 'uppercase' }}>{mat.file_type}</Typography>
        </View>
        {isDone && <CheckCircle2 size={16} color={theme.colors.green} />}
      </TouchableOpacity>
    );
  };

  const TestCard = ({ test }) => {
    const attData = data.attempts_map[test.id] || { latest: null, count: 0 };
    const attempt = attData.latest;
    const isPassed = attempt?.passed;
    
    // Check window
    const now = new Date(data.now_iso);
    const start = test.start_datetime ? new Date(test.start_datetime) : null;
    let statusText = "";
    let statusColor = theme.colors.t3;
    let isLocked = false;

    if (attempt) {
      statusText = isPassed ? "Passed" : "Attempted";
      statusColor = isPassed ? theme.colors.green : theme.colors.red;
      isLocked = attData.count >= test.max_attempts; // Lock only if all attempts used
    } else if (start && now < start) {
      statusText = `Opens: ${new Date(start).toLocaleDateString()} ${new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      statusColor = theme.colors.t3;
      isLocked = true;
    } else if (end && now > end) {
      statusText = "Closed";
      statusColor = theme.colors.red;
      isLocked = true;
    } else {
      statusText = "Open now";
      statusColor = theme.colors.green;
    }

    if (attData.count > 0 && attData.count < test.max_attempts) {
      statusText = `Attempts: ${attData.count}/${test.max_attempts} (Retry available)`;
      isLocked = false;
    }

    return (
      <TouchableOpacity 
        style={[styles.testCard, isLocked && { opacity: 0.6 }]} 
        activeOpacity={isLocked ? 1 : 0.8}
        onPress={() => isLocked ? null : navigation.navigate('TakeTest', { testId: test.id })}
      >
        <View style={styles.testHeader}>
          <HelpCircle size={20} color={isLocked ? theme.colors.t3 : theme.colors.acc} />
          <Typography variant="h3" style={{ flex: 1, marginBottom: 0, marginLeft: 10, color: isLocked ? theme.colors.t3 : theme.colors.t1 }}>{test.title}</Typography>
          {isPassed && <CheckCircle2 size={20} color={theme.colors.green} />}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 30, gap: 8 }}>
          <Typography variant="caption">
            {test.test_type.toUpperCase()} TEST • {test.duration_minutes} MINS
          </Typography>
          <Typography variant="caption" style={{ color: statusColor, fontWeight: '700' }}>
            • {statusText}
          </Typography>
        </View>
        {attempt && (
          <View style={styles.attemptInfo}>
            <Typography variant="small" style={{ color: isPassed ? theme.colors.green : theme.colors.red }}>
              Result: {attempt.score}/{attempt.total_marks} ({attempt.percentage}%) • {isPassed ? 'PASSED' : 'FAILED'}
            </Typography>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={theme.colors.t1} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Typography variant="h3" numberOfLines={1}>{data.module.title}</Typography>
          <Typography variant="small">{data.overall_pct}% Completed</Typography>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Typography variant="h3" style={styles.secTitle}>Course Content</Typography>
        
        {data.chapters.map(ch => (
          <View key={ch.id} style={styles.chapterBox}>
            <TouchableOpacity 
              style={styles.chapterHead} 
              onPress={() => toggleChapter(ch.id)}
              activeOpacity={0.7}
            >
              <Typography variant="h3" style={{ flex: 1, marginBottom: 0 }}>{ch.title}</Typography>
              {expandedChapters[ch.id] ? <ChevronUp size={20} color={theme.colors.t3} /> : <ChevronDown size={20} color={theme.colors.t3} />}
            </TouchableOpacity>
            
            {expandedChapters[ch.id] && (
              <View style={styles.chapterBody}>
                {data.mat_by_chapter[ch.id]?.map(mat => (
                  <MaterialRow key={mat.id} mat={mat} />
                ))}
              </View>
            )}
          </View>
        ))}

        {data.mat_by_chapter[0]?.length > 0 && (
          <View style={styles.chapterBox}>
            <Typography variant="h3" style={styles.chapterHead}>Uncategorized</Typography>
            <View style={styles.chapterBody}>
              {data.mat_by_chapter[0].map(mat => (
                <MaterialRow key={mat.id} mat={mat} />
              ))}
            </View>
          </View>
        )}

        <Spacer h={24} />
        <Typography variant="h3" style={styles.secTitle}>Assessments</Typography>
        {data.tests.map(t => <TestCard key={t.id} test={t} />)}

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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
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
  chapterBox: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.roundness.r4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  chapterHead: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card2,
  },
  chapterBody: {
    backgroundColor: theme.colors.card,
  },
  matRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 12,
  },
  matIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.roundness.r4,
    borderWidth: 1.5,
    borderColor: theme.colors.border2,
    padding: 16,
    marginBottom: 12,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  attemptInfo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  }
});
