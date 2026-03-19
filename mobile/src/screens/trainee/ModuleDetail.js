import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { Typography, Card, ThemedModal, PremiumLoading } from '../../components/UI';
import { Spacer } from '../../components/Form';
import api from '../../api/api';
import { 
  ChevronLeft, 
  PlayCircle, 
  FileText, 
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Video,
  Layers,
  Clock,
  Info
} from 'lucide-react-native';

export default function ModuleDetail({ route, navigation }) {
  const { moduleId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [notice, setNotice] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchModule();
    }, [])
  );

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

  if (loading || !data) return <PremiumLoading message="Loading Module Details..." />;

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
    const end = test.end_datetime ? new Date(test.end_datetime) : null;
    let statusText = "";
    let statusColor = theme.colors.t3;
    let isLocked = false;

    if (attempt) {
      statusText = isPassed ? "Passed" : "Attempted";
      statusColor = isPassed ? theme.colors.green : theme.colors.red;
      isLocked = attData.count >= test.max_attempts; 
    } else if (start && now < start) {
      statusText = "Scheduled";
      statusColor = theme.colors.amber;
      isLocked = true;
    } else if (end && now > end) {
      statusText = "Closed";
      statusColor = theme.colors.red;
      isLocked = true;
    } else {
      statusText = "Open now";
      statusColor = theme.colors.green;
    }

    const fmtTime = (d) => d ? new Date(d).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—';

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
        <View style={{ marginLeft: 30, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={12} color={theme.colors.t3} />
              <Typography variant="caption">{test.duration_minutes}m</Typography>
            </View>
            <Typography variant="caption" style={{ color: statusColor, fontWeight: '700' }}>
              ● {statusText}
            </Typography>
            {test.max_attempts > 1 && (
              <Typography variant="caption" style={{ color: theme.colors.t3 }}>
                Attempts: {attData.count}/{test.max_attempts}
              </Typography>
            )}
          </View>
          
          <View style={styles.testWindowRow}>
            <View style={{ flex: 1 }}>
              <Typography variant="small" style={styles.windowLabel}>START</Typography>
              <Typography variant="caption">{fmtTime(test.start_datetime)}</Typography>
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="small" style={styles.windowLabel}>END</Typography>
              <Typography variant="caption">{fmtTime(test.end_datetime)}</Typography>
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="small" style={styles.windowLabel}>PASS SCORE</Typography>
              <Typography variant="caption">{test.passing_marks}%</Typography>
            </View>
          </View>
        </View>

        {attempt && (
          <View style={styles.attemptInfo}>
            <View style={styles.resultBadge}>
              <Typography variant="small" style={{ color: isPassed ? theme.colors.green : theme.colors.red, fontWeight: '700' }}>
                LATEST SCORE: {Math.round(attempt.percentage)}% ({attempt.score}/{attempt.total_marks})
              </Typography>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Professional Header */}
        <View style={styles.premiumHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={theme.colors.t1} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.headerTopRow}>
              <View style={[styles.headerCatBadge, { backgroundColor: (data.module.color || theme.colors.acc) + '20' }]}>
                <Typography variant="small" style={[styles.headerCat, { color: data.module.color || theme.colors.acc }]}>
                  {data.module.category?.toUpperCase() || 'GENERAL'}
                </Typography>
              </View>
              <View style={styles.headerPhaseBadge}>
                <Typography variant="caption" style={{ color: theme.colors.t2, fontWeight: '800' }}>{data.module.status.toUpperCase()}</Typography>
              </View>
            </View>

            <Typography variant="h1" style={styles.headerTitle}>{data.module.title}</Typography>
            <Typography variant="body" style={styles.headerDesc}>{data.module.description}</Typography>

            <View style={styles.progressSection}>
              <View style={styles.progTextRow}>
                <Typography variant="small" style={{ color: theme.colors.t3 }}>
                  Overall Progress: {data.overall_pct}%
                </Typography>
                <Typography variant="small" style={{ color: theme.colors.t3 }}>
                  {data.done_mats}/{data.total_mats} completed
                </Typography>
              </View>
              <View style={styles.progBarBg}>
                <View style={[styles.progBarFill, { width: `${data.overall_pct}%`, backgroundColor: data.module.color || theme.colors.acc }]} />
              </View>
            </View>

            <View style={styles.headerMetaRow}>
              <View style={styles.metaItem}>
                <Layers size={14} color={theme.colors.t3} />
                <Typography variant="caption" style={styles.metaText}>
                  {data.module.training_type.replace('_',' ')}
                </Typography>
              </View>
              {data.module.meet_link && (
                <TouchableOpacity 
                  style={styles.metaItem}
                  onPress={() => {
                    const url = data.module.meet_link;
                    if (url) {
                      Linking.openURL(url).catch(() => setNotice({ title: 'Error', message: 'Cannot open meet link' }));
                    }
                  }}
                >
                  {data.module.training_type === 'virtual' ? <Video size={14} color={theme.colors.acc} /> : <MapPin size={14} color={theme.colors.acc} />}
                  <Typography variant="caption" style={[styles.metaText, { color: theme.colors.acc }]}>
                    {data.module.training_type === 'virtual' ? 'Join Meet' : 'Meet Link'}
                  </Typography>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.moduleWindowRow}>
              <View style={styles.windowBox}>
                <Clock size={12} color={theme.colors.t4} />
                <View>
                  <Typography variant="small" style={styles.headerLabel}>STARTS</Typography>
                  <Typography variant="caption" style={styles.dateText}>
                    {new Date(data.module.start_datetime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </Typography>
                </View>
              </View>
              <View style={styles.windowBox}>
                <Clock size={12} color={theme.colors.t4} />
                <View>
                  <Typography variant="small" style={styles.headerLabel}>ENDS</Typography>
                  <Typography variant="caption" style={styles.dateText}>
                    {data.module.end_datetime ? new Date(data.module.end_datetime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'No Deadline'}
                  </Typography>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Typography variant="h3" style={styles.sectionTitle}>Course Content</Typography>
          
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
          <Typography variant="h3" style={styles.sectionTitle}>Assessments</Typography>
          {data.tests.map(t => <TestCard key={t.id} test={t} />)}

          <Spacer h={40} />
        </View>
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumHeader: {
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderBottomWidth:1,
    borderBottomColor: theme.colors.border + '30',
  },
  backBtn: {
    padding: 12,
    marginLeft: 12,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerCatBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerCat: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerPhaseBadge: {
    backgroundColor: theme.colors.card2,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border + '50',
  },
  headerTitle: {
    color: theme.colors.t1,
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 12,
  },
  headerDesc: {
    color: theme.colors.t2,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  progressSection: {
    marginBottom: 20,
  },
  progTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progBarBg: {
    height: 8,
    backgroundColor: theme.colors.card2,
    borderRadius: 4,
  },
  progBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  headerMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.card2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border + '30',
  },
  metaText: {
    color: theme.colors.t2,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    color: theme.colors.t1,
  },
  chapterBox: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.roundness.r4,
    borderWidth: 1,
    borderColor: theme.colors.border + '30',
    marginBottom: 16,
    overflow: 'hidden',
  },
  chapterHead: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chapterBody: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + '30',
  },
  matRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + '15',
  },
  matIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testCard: {
    backgroundColor: theme.colors.card,
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border + '30',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  testWindowRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + '15',
    gap: 16,
  },
  windowLabel: {
    color: theme.colors.t4,
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  moduleWindowRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  windowBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLabel: {
    color: theme.colors.t4,
    fontWeight: '800',
    fontSize: 9,
    letterSpacing: 1,
  },
  dateText: {
    color: theme.colors.t2,
    fontWeight: '600',
  },
  attemptInfo: {
    marginTop: 12,
  },
  resultBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  }
});
