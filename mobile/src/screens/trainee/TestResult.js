import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Card, Button } from '../../components/UI';
import { Spacer } from '../../components/Form';
import { 
  CheckCircle, 
  XCircle, 
  Trophy, 
  ChevronLeft,
  ArrowRight,
  BookOpen
} from 'lucide-react-native';

export default function TestResult({ route, navigation }) {
  const { score, total, testTitle, passed, moduleId } = route.params;
  const percentage = Math.round((score / total) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={styles.backBtn}>
          <ChevronLeft size={24} color={theme.colors.t1} />
        </TouchableOpacity>
        <Typography variant="h3" style={{ marginBottom: 0 }}>Test Result</Typography>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={[styles.resultCard, { borderColor: passed ? theme.colors.green : theme.colors.red }]}>
          <View style={[styles.iconBox, { backgroundColor: passed ? theme.colors.greenBg : theme.colors.redBg }]}>
            {passed ? <Trophy size={48} color={theme.colors.green} /> : <XCircle size={48} color={theme.colors.red} />}
          </View>
          
          <Spacer h={24} />
          
          <Typography variant="h1" style={{ textAlign: 'center', marginBottom: 8 }}>
            {passed ? 'Congratulations!' : 'Keep Practicing!'}
          </Typography>
          <Typography variant="body" style={{ textAlign: 'center', color: theme.colors.t3 }}>
            {passed ? 'You have successfully passed the test.' : 'You did not reach the passing score this time.'}
          </Typography>

          <Spacer h={32} />

          <View style={styles.scoreBox}>
            <View style={styles.scoreCol}>
              <Typography variant="caption">Your Score</Typography>
              <Typography variant="h1" style={{ marginBottom: 0 }}>{score}/{total}</Typography>
            </View>
            <View style={styles.dividerV} />
            <View style={styles.scoreCol}>
              <Typography variant="caption">Percentage</Typography>
              <Typography variant="h1" style={{ marginBottom: 0 }}>{percentage}%</Typography>
            </View>
          </View>

          <View style={styles.statusBadge}>
            <Typography style={{ color: passed ? theme.colors.green : theme.colors.red, fontWeight: '700', textTransform: 'uppercase' }}>
              Result: {passed ? 'PASSED' : 'FAILED'}
            </Typography>
          </View>
        </Card>

        <Spacer h={32} />

        <Button 
          title="Return to Module" 
          onPress={() => navigation.navigate('ModuleDetail', { moduleId })}
          icon={BookOpen}
        />
        <Spacer h={12} />
        <Button 
          title="Go to Dashboard" 
          variant="outline"
          onPress={() => navigation.navigate('Dashboard')}
          icon={ArrowRight}
        />
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
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  resultCard: {
    alignItems: 'center',
    padding: 32,
    borderWidth: 2,
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBox: {
    flexDirection: 'row',
    width: '100%',
    padding: 20,
    backgroundColor: theme.colors.card2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  scoreCol: {
    flex: 1,
    alignItems: 'center',
  },
  dividerV: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 10,
  },
  statusBadge: {
    marginTop: 24,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.card2,
  }
});
