import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Text
} from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Card, Button, ThemedModal, PremiumLoading } from '../../components/UI';
import { Spacer } from '../../components/Form';
import api from '../../api/api';
import { 
  ChevronLeft, 
  Timer, 
  Award, 
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  HelpCircle
} from 'lucide-react-native';

export default function TakeTest({ route, navigation }) {
  const { testId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notice, setNotice] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, subtext: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTest();
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && data) {
      // Auto submit?
    }
  }, [timeLeft]);

  const fetchTest = async () => {
    try {
      const res = await api.get(`/api/trainee/test/${testId}`);
      if (res.data && res.data.test) {
        setData(res.data);
        setTimeLeft((res.data.test.duration_minutes || 0) * 60);
      } else {
        throw new Error("Invalid test data");
      }
    } catch (e) {
      setNotice({ 
        title: 'Notice', 
        message: e.response?.data?.detail || 'This content is currently unavailable.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (qid, opt) => {
    setAnswers(prev => ({ ...prev, [qid]: opt }));
  };

  const handleSubmit = async () => {
    setConfirmModal({ show: true, subtext: 'Are you sure you want to submit your answers?' });
  };

  const confirmSubmit = async () => {
    setConfirmModal({ ...confirmModal, show: false });
    setIsSubmitting(true);
    try {
      const res = await api.post(`/api/trainee/test/${testId}/submit`, { answers });
      navigation.replace('TestResult', { 
        score: res.data.score, 
        total: res.data.total, 
        passed: res.data.passed,
        testTitle: data.test.title,
        moduleId: data.test.module_id
      });
    } catch (e) {
      setNotice({ title: 'Submission Failed', message: 'Please try again' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !data) return (
    <PremiumLoading 
      message="Initializing Assessment..." 
      subtext="Please wait while we prepare your questions"
    />
  );

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={theme.colors.t1} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Typography variant="h2" style={styles.headerTitle}>Assessment</Typography>
          <Typography variant="caption" style={styles.headerSub}>
            Trainer decides when he will post the assessment
          </Typography>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progTextRow}>
          <Typography variant="h3" style={styles.progCounter}>
            <Text>{String(currentIndex + 1).padStart(2, '0')}</Text>
            <Text style={{ color: theme.colors.t4 }}>
              /{String(data.questions.length).padStart(2, '0')}
            </Text>
          </Typography>
          <View style={styles.pointsBadge}>
            <Award size={14} color={theme.colors.acc} />
            <Typography variant="small" style={styles.pointsText}>{data.questions[currentIndex].marks.toFixed(1)} Points</Typography>
          </View>
        </View>
        <View style={styles.progBarBg}>
          <View style={[styles.progBarFill, { width: `${((currentIndex + 1) / data.questions.length) * 100}%` }]} />
        </View>
      </View>

      <View style={{ flex: 1, marginBottom: 100 }}>
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.questionContainer}>
            <Typography variant="h2" style={styles.qText}>{data.questions[currentIndex].question_text}</Typography>
            
            <View style={styles.optionsList}>
              {['a', 'b', 'c', 'd'].map((opt, i) => {
                const label = opt.toUpperCase();
                const isSelected = answers[data.questions[currentIndex].id] === label;
                const optVal = data.questions[currentIndex][`option_${opt}`];
                if (!optVal) return null;

                return (
                  <TouchableOpacity 
                    key={opt}
                    style={[styles.optBtn, isSelected && styles.optBtnActive]}
                    onPress={() => handleSelect(data.questions[currentIndex].id, label)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optKey, isSelected && styles.optKeyActive]}>
                      <Typography style={[styles.optKeyText, isSelected && styles.optKeyTextActive]}>
                        {label}
                      </Typography>
                    </View>
                    <Typography style={[styles.optValText, isSelected && styles.optValTextActive]}>
                      {optVal}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <Spacer h={40} /> 
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <View style={styles.timerBox}>
          <Timer size={16} color={timeLeft < 60 ? theme.colors.red : theme.colors.t3} />
          <Typography variant="small" style={[styles.timerText, timeLeft < 60 && { color: theme.colors.red }]}>
            {formatTime(timeLeft)}
          </Typography>
        </View>

        <View style={styles.navBtns}>
          <TouchableOpacity 
            style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]} 
            onPress={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <ArrowLeft size={20} color={currentIndex === 0 ? theme.colors.t4 : theme.colors.t2} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.mainNavBtn, currentIndex === data.questions.length - 1 ? styles.finishBtn : {}]} 
            onPress={() => {
              if (currentIndex < data.questions.length - 1) {
                setCurrentIndex(currentIndex + 1);
              } else {
                handleSubmit();
              }
            }}
          >
            <Typography variant="body" style={styles.mainNavBtnText}>
              {currentIndex === data.questions.length - 1 ? 'Finish' : 'Next'}
            </Typography>
            {currentIndex < data.questions.length - 1 && <ArrowRight size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>

      <ThemedModal 
        visible={!!notice}
        title={notice?.title}
        message={notice?.message}
        onConfirm={() => {
          setNotice(null);
          if (notice?.title !== 'Submission Failed') navigation.goBack();
        }}
      />

      <ThemedModal
        visible={confirmModal.show}
        title="Submit Test"
        message={confirmModal.subtext}
        onConfirm={confirmSubmit}
        onClose={() => setConfirmModal({ ...confirmModal, show: false })}
        confirmText={isSubmitting ? "Submitting..." : "Submit"}
        confirmDisabled={isSubmitting}
      />
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
    backgroundColor: theme.colors.bg,
    gap: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerSub: {
    color: theme.colors.t4,
    fontSize: 11,
    fontWeight: '600',
  },
  progressSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  progTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  progCounter: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.t1,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.acc + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.acc + '30',
  },
  pointsText: {
    color: theme.colors.acc,
    fontWeight: '800',
    fontSize: 12,
  },
  progBarBg: {
    height: 8,
    backgroundColor: theme.colors.card,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border + '30',
  },
  progBarFill: {
    height: '100%',
    backgroundColor: theme.colors.acc,
    borderRadius: 4,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 10,
    flexGrow: 1,
  },
  questionContainer: {
    marginTop: 10,
  },
  qText: {
    fontSize: 20,
    lineHeight: 30,
    color: theme.colors.t1,
    marginBottom: 32,
  },
  optionsList: {
    gap: 16,
  },
  optBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.border + '50',
    gap: 16,
  },
  optBtnActive: {
    borderColor: theme.colors.acc,
    backgroundColor: theme.colors.acc + '08',
  },
  optKey: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optKeyActive: {
    backgroundColor: theme.colors.acc,
    borderColor: theme.colors.acc,
  },
  optKeyText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.t2,
  },
  optKeyTextActive: {
    color: '#fff',
  },
  optValText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.t2,
    fontWeight: '500',
  },
  optValTextActive: {
    color: theme.colors.t1,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.bg,
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + '50',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timerText: {
    color: theme.colors.t3,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  navBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  navBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  mainNavBtn: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: theme.colors.acc,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: theme.colors.acc,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  finishBtn: {
    backgroundColor: theme.colors.green,
    shadowColor: theme.colors.green,
  },
  mainNavBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  }
});
