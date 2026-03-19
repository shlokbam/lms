import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Button, Card } from '../../components/UI';
import { Spacer } from '../../components/Form';
import api from '../../api/api';
import { ChevronLeft, Timer } from 'lucide-react-native';

export default function TakeTest({ route, navigation }) {
  const { testId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

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
      Alert.alert('Error', e.response?.data?.detail || 'Failed to load test');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (qid, opt) => {
    setAnswers(prev => ({ ...prev, [qid]: opt }));
  };

  const handleSubmit = async () => {
    Alert.alert(
      'Submit Test',
      'Are you sure you want to submit your answers?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          onPress: async () => {
            try {
              const res = await api.post(`/api/trainee/test/${testId}/submit`, { answers });
              navigation.navigate('TestResult', { 
                score: res.data.score, 
                total: res.data.total, 
                passed: res.data.passed,
                testTitle: data.test.title,
                moduleId: data.test.module_id
              });
            } catch (e) {
              Alert.alert('Submission Failed', 'Please try again');
            }
          }
        }
      ]
    );
  };

  if (loading || !data) return (
    <View style={[styles.container, styles.center]}>
      <ActivityIndicator size="large" color={theme.colors.acc} />
      <Spacer h={10} />
      <Typography variant="small">Loading Test...</Typography>
    </View>
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
          <Typography variant="h3" numberOfLines={1}>{data.test.title}</Typography>
          <View style={styles.timerRow}>
            <Timer size={14} color={timeLeft < 60 ? theme.colors.red : theme.colors.t3} />
            <Typography variant="small" style={{ color: timeLeft < 60 ? theme.colors.red : theme.colors.t3, marginLeft: 4 }}>
              {formatTime(timeLeft)} Remaining
            </Typography>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {data.questions.map((q, idx) => (
          <Card key={q.id} style={styles.qCard}>
            <View style={styles.qNum}>
              <Typography style={{ color: '#fff', fontWeight: 'bold' }}>{idx + 1}</Typography>
            </View>
            <Typography variant="h3" style={styles.qText}>{q.question_text}</Typography>
            
            {['a', 'b', 'c', 'd'].map(opt => (
              <TouchableOpacity 
                key={opt}
                style={[
                  styles.optBtn, 
                  answers[q.id] === opt.toUpperCase() && styles.optBtnActive
                ]}
                onPress={() => handleSelect(q.id, opt.toUpperCase())}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.optKey,
                  answers[q.id] === opt.toUpperCase() && styles.optKeyActive
                ]}>
                  <Typography style={{ color: answers[q.id] === opt.toUpperCase() ? '#fff' : theme.colors.t2, fontWeight: '700' }}>
                    {opt.toUpperCase()}
                  </Typography>
                </View>
                <Typography style={{ flex: 1 }}>{q[`option_${opt}`]}</Typography>
              </TouchableOpacity>
            ))}
          </Card>
        ))}

        <Spacer h={20} />
        <Button title="Submit Test" onPress={handleSubmit} />
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
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scroll: {
    padding: 20,
  },
  qCard: {
    marginBottom: 20,
    padding: 20,
  },
  qNum: {
    width: 26,
    height: 26,
    backgroundColor: theme.colors.acc,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  qText: {
    marginBottom: 16,
  },
  optBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.card2,
    borderRadius: theme.roundness.r2,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    marginBottom: 8,
    gap: 12,
  },
  optBtnActive: {
    borderColor: theme.colors.acc,
    backgroundColor: theme.colors.accBg,
  },
  optKey: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optKeyActive: {
    backgroundColor: theme.colors.acc,
  }
});
