import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Card, Spacer, PremiumLoading, Button, ThemedPicker } from '../../components/UI';
import { ChevronLeft, Plus, Trash2, Clock, Calendar, CheckSquare, Save } from 'lucide-react-native';
import api from '../../api/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateEditTest() {
  const navigation = useNavigation();
  const route = useRoute();
  const { moduleId, testId } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testData, setTestData] = useState({
    title: '',
    test_type: 'pre',
    duration: 30,
    start_datetime: '',
    end_datetime: '',
    passing_marks: 60,
    max_attempts: 1,
    questions: [
      { text: '', a: '', b: '', c: '', d: '', correct: 'A', marks: 1 }
    ]
  });

  const [showPicker, setShowPicker] = useState({ show: false, field: null, mode: 'date' });

  const formatDateForBackend = (date) => {
    if (!date) return '';
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const formatDateForDisplay = (str) => {
    if (!str) return 'Select...';
    const d = new Date(str);
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  useEffect(() => {
    if (testId) {
      fetchTestDetails();
    } else {
      // Set default dates if new test
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setTestData(prev => ({
        ...prev,
        start_datetime: formatDateForBackend(now),
        end_datetime: formatDateForBackend(tomorrow)
      }));
    }
  }, [testId]);

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/trainer/module/${moduleId}/test/${testId}`);
      const data = res.data;
      
      setTestData({
        title: data.title,
        test_type: data.test_type,
        duration: data.duration_minutes,
        start_datetime: data.start_datetime ? data.start_datetime.slice(0, 16) : '',
        end_datetime: data.end_datetime ? data.end_datetime.slice(0, 16) : '',
        passing_marks: data.passing_marks,
        max_attempts: data.max_attempts,
        questions: data.questions.map(q => ({
          text: q.question_text,
          a: q.option_a,
          b: q.option_b,
          c: q.option_c,
          d: q.option_d,
          correct: q.correct_option,
          marks: q.marks
        }))
      });
    } catch (e) {
      alert("Failed to load test details");
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setTestData(prev => ({
      ...prev,
      questions: [...prev.questions, { text: '', a: '', b: '', c: '', d: '', correct: 'A', marks: 1 }]
    }));
  };

  const removeQuestion = (index) => {
    if (testData.questions.length === 1) return;
    const newQs = [...testData.questions];
    newQs.splice(index, 1);
    setTestData(prev => ({ ...prev, questions: newQs }));
  };

  const updateQuestion = (index, field, value) => {
    const newQs = [...testData.questions];
    newQs[index] = { ...newQs[index], [field]: value };
    setTestData(prev => ({ ...prev, questions: newQs }));
  };

  const handleSave = async () => {
    if (!testData.title.trim()) return alert("Please enter a test title");
    if (testData.questions.some(q => !q.text.trim())) return alert("All questions must have text");
    
    setSubmitting(true);
    try {
      const payload = {
        ...testData,
        start_datetime: testData.start_datetime + ":00",
        end_datetime: testData.end_datetime + ":00"
      };

      if (testId) {
        await api.put(`/api/trainer/module/${moduleId}/test/${testId}`, payload);
      } else {
        await api.post(`/api/trainer/module/${moduleId}/test`, payload);
      }
      
      Alert.alert("Success", "Test saved successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      alert(e.response?.data?.detail || "Failed to save test");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PremiumLoading message="Loading Assessment Builder..." />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={theme.colors.t1} />
        </TouchableOpacity>
        <Typography variant="h2" style={{ marginBottom: 0 }}>{testId ? 'Edit Test' : 'New Test'}</Typography>
        <Button 
          title="Save" 
          variant="primary" 
          size="small" 
          onPress={handleSave} 
          disabled={submitting}
          icon={<Save size={16} color="#fff" />}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.configCard}>
          <Typography variant="h3">Test Configuration</Typography>
          <Spacer h={16} />
          
          <Typography variant="label">Title *</Typography>
          <TextInput 
            style={styles.input}
            value={testData.title}
            onChangeText={(t) => setTestData(p => ({...p, title: t}))}
            placeholder="e.g. Final Assessment"
            placeholderTextColor={theme.colors.t4}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <ThemedPicker
                label="Test Type"
                value={testData.test_type}
                onValueChange={(v) => setTestData(p => ({...p, test_type: v}))}
                items={[
                  { label: 'Pre-Test', value: 'pre' },
                  { label: 'Mid-Test', value: 'mid' },
                  { label: 'Post-Test', value: 'post' }
                ]}
              />
            </View>
            <Spacer w={12} />
            <View style={{ flex: 1 }}>
              <Typography variant="label">Duration (min)</Typography>
              <TextInput 
                style={styles.input}
                value={String(testData.duration)}
                keyboardType="numeric"
                onChangeText={(t) => setTestData(p => ({...p, duration: parseInt(t) || 0}))}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Typography variant="label">Passing %</Typography>
              <TextInput 
                style={styles.input}
                value={String(testData.passing_marks)}
                keyboardType="numeric"
                onChangeText={(t) => setTestData(p => ({...p, passing_marks: parseInt(t) || 0}))}
              />
            </View>
            <Spacer w={12} />
            <View style={{ flex: 1 }}>
              <Typography variant="label">Max Attempts</Typography>
              <TextInput 
                style={styles.input}
                value={String(testData.max_attempts)}
                keyboardType="numeric"
                onChangeText={(t) => setTestData(p => ({...p, max_attempts: parseInt(t) || 1}))}
              />
            </View>
          </View>

          <Typography variant="label">Start Time</Typography>
          <TouchableOpacity 
            style={styles.input} 
            onPress={() => setShowPicker({ show: true, field: 'start_datetime', mode: 'date' })}
          >
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Typography style={{ color: testData.start_datetime ? '#fff' : theme.colors.t4, fontSize: 13 }}>
                {formatDateForDisplay(testData.start_datetime)}
              </Typography>
            </View>
          </TouchableOpacity>

          <Typography variant="label">End Time</Typography>
          <TouchableOpacity 
            style={styles.input} 
            onPress={() => setShowPicker({ show: true, field: 'end_datetime', mode: 'date' })}
          >
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Typography style={{ color: testData.end_datetime ? '#fff' : theme.colors.t4, fontSize: 13 }}>
                {formatDateForDisplay(testData.end_datetime)}
              </Typography>
            </View>
          </TouchableOpacity>
        </Card>

        <Spacer h={24} />
        <View style={styles.sectionHeader}>
          <Typography variant="h2" style={{ marginBottom: 0 }}>Question Bank ({testData.questions.length})</Typography>
          <Button title="Add" variant="secondary" size="small" onPress={addQuestion} icon={<Plus size={14} color={theme.colors.acc} />} />
        </View>
        <Spacer h={16} />

        {testData.questions.map((q, qIdx) => (
          <Card key={qIdx} style={styles.qCard}>
            <View style={styles.row}>
              <View style={styles.qBadge}><Typography style={{ color: '#fff', fontWeight: 'bold' }}>{qIdx + 1}</Typography></View>
              <TextInput 
                style={[styles.input, { flex: 1, marginLeft: 12, marginBottom: 0 }]}
                placeholder="Question text..."
                placeholderTextColor={theme.colors.t4}
                value={q.text}
                onChangeText={(t) => updateQuestion(qIdx, 'text', t)}
                multiline
              />
              <TouchableOpacity onPress={() => removeQuestion(qIdx)} style={{ marginLeft: 8 }}>
                <Trash2 size={20} color={theme.colors.red} />
              </TouchableOpacity>
            </View>
            
            <Spacer h={16} />
            <View style={styles.optionsGrid}>
              {['a', 'b', 'c', 'd'].map(opt => (
                <View key={opt} style={styles.optionRow}>
                  <TouchableOpacity 
                    style={[styles.optIndicator, q.correct === opt.toUpperCase() && styles.optIndicatorActive]}
                    onPress={() => updateQuestion(qIdx, 'correct', opt.toUpperCase())}
                  >
                    <Typography style={{ color: q.correct === opt.toUpperCase() ? '#fff' : theme.colors.t3, fontWeight: '800' }}>
                      {opt.toUpperCase()}
                    </Typography>
                  </TouchableOpacity>
                  <TextInput 
                    style={[styles.input, { flex: 1, marginBottom: 0, height: 40, fontSize: 13 }]}
                    placeholder={`Option ${opt.toUpperCase()}`}
                    placeholderTextColor={theme.colors.t4}
                    value={q[opt]}
                    onChangeText={(t) => updateQuestion(qIdx, opt, t)}
                  />
                </View>
              ))}
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
              <Typography variant="small" style={{ color: theme.colors.t4 }}>Marks:</Typography>
              <TextInput 
                style={[styles.input, { width: 40, height: 30, marginBottom: 0, marginLeft: 8, textAlign: 'center', fontSize: 12 }]}
                value={String(q.marks)}
                keyboardType="numeric"
                onChangeText={(t) => updateQuestion(qIdx, 'marks', parseInt(t) || 1)}
              />
              <Spacer w={16} />
              <Typography variant="small" style={{ color: theme.colors.t4, flex: 1 }}>Correct Answer: <Typography variant="small" style={{ color: theme.colors.green, fontWeight: 'bold' }}>{q.correct}</Typography></Typography>
            </View>
          </Card>
        ))}

        <Spacer h={100} />
      </ScrollView>

      {showPicker.show && (
      <DateTimePicker
        value={testData[showPicker.field] ? new Date(testData[showPicker.field]) : new Date()}
        mode={showPicker.mode}
        is24Hour={true}
        display="default"
        onChange={(event, selectedDate) => {
          if (event.type === 'dismissed') {
            setShowPicker({ show: false, field: null, mode: 'date' });
            return;
          }
          
          const currentDate = selectedDate || new Date();
          if (showPicker.mode === 'date') {
            setShowPicker({ ...showPicker, mode: 'time' });
            setTestData(f => ({ ...f, [showPicker.field]: formatDateForBackend(currentDate) }));
          } else {
            setShowPicker({ show: false, field: null, mode: 'date' });
            setTestData(f => ({ ...f, [showPicker.field]: formatDateForBackend(currentDate) }));
          }
        }}
      />
    )}
  </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
  scroll: { padding: 24 },
  configCard: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: {
    backgroundColor: theme.colors.card2,
    color: theme.colors.t1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 15
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  pickerContainer: {
    backgroundColor: theme.colors.card2,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: 48,
    justifyContent: 'center'
  },
  pickerInput: { color: theme.colors.t1, paddingHorizontal: 12, fontSize: 15, height: 48 },
  qCard: { padding: 16, marginBottom: 16 },
  qBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.acc, alignItems: 'center', justifyContent: 'center' },
  optionsGrid: { gap: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optIndicator: { width: 36, height: 36, borderRadius: 8, backgroundColor: theme.colors.card2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  optIndicatorActive: { backgroundColor: theme.colors.green, borderColor: theme.colors.green }
});
