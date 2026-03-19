import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  Dimensions,
  FlatList
} from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Card } from '../../components/UI';
import { Spacer } from '../../components/Form';
import api from '../../api/api';
import { HelpCircle, ChevronRight, Clock, Award } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function Quizzes({ navigation }) {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/api/trainee/dashboard');
      setData(res.data);
      
      // Extract all tests from all phases
      const allTests = [];
      ['ongoing', 'upcoming', 'completed'].forEach(phase => {
        if (res.data[phase]) {
          res.data[phase].forEach(module => {
            if (module.tests) {
              module.tests.forEach(test => {
                allTests.push({
                  ...test,
                  moduleTitle: module.title,
                  moduleId: module.id,
                  phase: module.phase
                });
              });
            }
          });
        }
      });
      setQuizzes(allTests);
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

  const QuizCard = ({ quiz }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('ModuleDetail', { moduleId: quiz.moduleId })}
      style={styles.quizCard}
    >
      <Card style={styles.cardInner}>
        <View style={styles.iconBox}>
          <HelpCircle size={24} color={theme.colors.acc} />
        </View>
        <View style={{ flex: 1 }}>
          <Typography variant="small" style={styles.modTitle}>{quiz.moduleTitle}</Typography>
          <Typography variant="h3" style={styles.quizTitle}>{quiz.title}</Typography>
          <View style={styles.metaRow}>
            <View style={styles.meta}>
              <Clock size={12} color={theme.colors.t3} />
              <Typography variant="caption" style={{ marginLeft: 4, color: theme.colors.t3 }}>
                {quiz.duration_minutes}m
              </Typography>
            </View>
            <View style={styles.meta}>
              <Award size={12} color={theme.colors.t3} />
              <Typography variant="caption" style={{ marginLeft: 4, color: theme.colors.t3 }}>
                Pass: {quiz.pass_score}%
              </Typography>
            </View>
          </View>
        </View>
        <ChevronRight size={20} color={theme.colors.border} />
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2">My Quizzes</Typography>
        <Typography variant="caption" style={{ color: theme.colors.t3 }}>
          Analyze your performance in assessments
        </Typography>
      </View>

      <FlatList 
        data={quizzes}
        renderItem={({ item }) => <QuizCard quiz={item} />}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.acc} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <HelpCircle size={48} color={theme.colors.border} />
            <Spacer h={16} />
            <Typography style={{ color: theme.colors.t3 }}>No quizzes available</Typography>
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
  list: {
    padding: 24,
    paddingTop: 0,
    paddingBottom: 100,
  },
  quizCard: {
    marginBottom: 16,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.acc + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modTitle: {
    color: theme.colors.acc,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  quizTitle: {
    fontSize: 16,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  }
});
