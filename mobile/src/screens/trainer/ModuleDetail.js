import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, TextInput } from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Card, Spacer, PremiumLoading, Button, ThemedModal } from '../../components/UI';
import { ChevronLeft, Plus, Trash2, FileText, Video, Layers, Beaker, Calendar, Upload } from 'lucide-react-native';
import api from '../../api/api';
import * as DocumentPicker from 'expo-document-picker';
import RNPickerSelect from 'react-native-picker-select';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function TrainerModuleDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { moduleId, tab } = route.params || {};
  console.log("[ModuleDetail] Rendered with moduleId:", moduleId);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(tab || 'content'); // Use passed tab
  const [addingChapter, setAddingChapter] = useState(false);
  const [addingTest, setAddingTest] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState('');

  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', phase: 'pre', chapter_id: null, file: null });
  const [submitting, setSubmitting] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [selectedTestId, setSelectedTestId] = useState(null);

  useEffect(() => {
    if (moduleId) {
      fetchDetail();
    }
  }, [moduleId]);

  useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);

  useEffect(() => {
    if (activeTab === 'reports' && moduleId) {
      fetchReports();
    }
  }, [activeTab, moduleId]);

  const fetchReports = async () => {
    try {
      const res = await api.get(`/api/trainer/module/${moduleId}/reports`);
      setReportData(res.data);
      if (res.data.tests?.length > 0 && !selectedTestId) {
        setSelectedTestId(res.data.tests[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/trainer/module/${moduleId}`);
      setData(res.data);
    } catch (e) {
      console.error(e);
      alert("Failed to load module details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/api/trainer/module/${moduleId}/chapter/add`, {
        chapter_title: newChapterTitle
      });
      setNewChapterTitle('');
      setAddingChapter(false);
      fetchDetail();
    } catch (e) {
      alert("Failed to add chapter");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteChapter = (chId) => {
    Alert.alert("Delete Chapter", "Are you sure? This will delete all materials inside.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await api.delete(`/api/trainer/module/${moduleId}/chapter/${chId}`);
          fetchDetail();
        } catch (e) { alert("Failed to delete chapter"); }
      }}
    ]);
  };

  const pickFile = async (chapterId = null) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setUploadForm({
          title: file.name,
          phase: 'pre',
          chapter_id: chapterId,
          file: file
        });
        setAddingMaterial(true);
      }
    } catch (err) {
      console.error(err);
      alert("Error picking file");
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: uploadForm.file.uri,
        name: uploadForm.file.name,
        type: uploadForm.file.mimeType || 'application/octet-stream',
      });
      formData.append('title', uploadForm.title || uploadForm.file.name);
      formData.append('phase', uploadForm.phase);
      if (uploadForm.chapter_id) {
        formData.append('chapter_id', uploadForm.chapter_id);
      }

      await api.post(`/api/trainer/module/${moduleId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setAddingMaterial(false);
      setUploadForm({ title: '', phase: 'pre', chapter_id: null, file: null });
      fetchDetail();
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.detail || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMaterial = (chId, matId) => {
    Alert.alert("Delete Material", "Are you sure you want to delete this material?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await api.delete(`/api/trainer/module/${moduleId}/material/${matId}`);
          fetchDetail();
        } catch (e) { alert("Failed to delete material"); }
      }}
    ]);
  };

  const deleteTest = (testId) => {
    Alert.alert("Delete Test", "Are you sure? This will delete all question and attempt records.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await api.delete(`/api/trainer/module/${moduleId}/test/${testId}`);
          fetchDetail();
        } catch (e) { alert("Failed to delete test"); }
      }}
    ]);
  };

  if (loading || !data) return <PremiumLoading message="Opening Module Control..." />;

  const { module, chapters, mat_by_chapter, tests } = data;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={theme.colors.t1} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Typography variant="h2" numberOfLines={1} style={{ marginBottom: 0 }}>{module.title}</Typography>
          <Typography variant="caption" style={{ color: theme.colors.acc }}>Trainer Control Panel</Typography>
        </View>
      </View>

      <View style={styles.tabBar}>
        {['content', 'tests', 'reports'].map(t => (
          <TouchableOpacity 
            key={t} 
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Typography variant="small" style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t.toUpperCase()}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDetail(); }} tintColor={theme.colors.acc} />}
      >
        {activeTab === 'content' && (
          <>
            <View style={styles.sectionHeader}>
              <Typography variant="h2" style={{ marginBottom: 0, flex: 1 }}>Chapters</Typography>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity style={styles.headerActionBtn} onPress={() => setAddingChapter(true)}>
                  <Plus size={18} color={theme.colors.acc} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerActionBtn} onPress={() => pickFile()}>
                  <Upload size={18} color={theme.colors.acc} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerActionBtn} onPress={() => navigation.navigate('ModuleReports', { moduleId })}>
                  <Calendar size={18} color={theme.colors.acc} />
                </TouchableOpacity>
              </View>
            </View>
            <Spacer h={16} />
            
            {chapters.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Typography variant="body" style={{ color: theme.colors.t4 }}>No chapters added yet.</Typography>
              </Card>
            ) : (
              chapters.map(ch => (
                <Card key={ch.id} style={styles.chapterCard}>
                  <View style={styles.row}>
                    <Layers size={18} color={theme.colors.acc} />
                    <Typography variant="h3" style={{ flex: 1, marginLeft: 12, marginBottom: 0 }}>{ch.title}</Typography>
                    <TouchableOpacity onPress={() => deleteChapter(ch.id)}>
                      <Trash2 size={18} color={theme.colors.red} style={{ opacity: 0.7 }} />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Materials in chapter */}
                  <View style={{ marginTop: 12 }}>
                    {(mat_by_chapter[ch.id] || []).map(mat => (
                      <View key={mat.id} style={styles.matItem}>
                        {mat.file_type === 'video' ? <Video size={14} color={theme.colors.t3} /> : <FileText size={14} color={theme.colors.t3} />}
                        <Typography variant="small" style={{ flex: 1, marginLeft: 8, color: theme.colors.t3 }}>{mat.title}</Typography>
                        <TouchableOpacity onPress={() => deleteMaterial(ch.id, mat.id)}>
                          <Trash2 size={14} color={theme.colors.t4} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity style={styles.addMatBtn} onPress={() => pickFile(ch.id)}>
                      <Plus size={14} color={theme.colors.acc} />
                      <Typography variant="small" style={{ color: theme.colors.acc, marginLeft: 4 }}>Add Material</Typography>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        {activeTab === 'tests' && (
          <>
            <View style={styles.sectionHeader}>
              <Typography variant="h2" style={{ marginBottom: 0 }}>Assessments</Typography>
              <Button title="New Test" variant="primary" size="small" onPress={() => navigation.navigate('CreateEditTest', { moduleId })} />
            </View>
            <Spacer h={16} />
            {tests.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Typography variant="body" style={{ color: theme.colors.t4 }}>No tests configured.</Typography>
              </Card>
            ) : (
              tests.map(test => (
                <Card key={test.id} style={styles.testCard}>
                  <View style={styles.row}>
                    <Beaker size={20} color={theme.colors.acc} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Typography variant="h3" style={{ marginBottom: 2 }}>{test.title}</Typography>
                      <Typography variant="small" style={{ color: theme.colors.t4 }}>{test.test_type.toUpperCase()} • {test.duration_minutes}m</Typography>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('CreateEditTest', { moduleId, testId: test.id })}>
                      <Typography style={{ color: theme.colors.acc, marginRight: 12 }}>Edit</Typography>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteTest(test.id)}>
                      <Trash2 size={18} color={theme.colors.red} style={{ opacity: 0.7 }} />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        {activeTab === 'reports' && (
          <>
            <Typography variant="h2">Test Performance</Typography>
            {reportData?.tests?.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
                {reportData.tests.map(t => (
                  <TouchableOpacity 
                    key={t.id} 
                    style={[styles.testPuck, selectedTestId === t.id && styles.testPuckActive]}
                    onPress={() => setSelectedTestId(t.id)}
                  >
                    <Typography variant="small" style={{ color: selectedTestId === t.id ? '#fff' : theme.colors.t3 }}>
                      {t.title}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <Spacer h={12} />
            
            {(reportData?.reports || []).filter(r => r.test_id === selectedTestId || !selectedTestId).map((rep, i) => (
              <Card key={i} style={styles.enrolleeCard}>
                <View style={styles.row}>
                  <View style={styles.avatar}>
                    <Typography style={{ color: '#fff', fontWeight: 'bold' }}>{rep.trainee_name[0]}</Typography>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Typography variant="body" style={{ fontWeight: '700' }}>{rep.trainee_name}</Typography>
                    <Typography variant="small" style={{ color: theme.colors.t4 }}>{rep.score !== null ? `Score: ${rep.score}/${rep.total_marks}` : 'No attempt'}</Typography>
                  </View>
                  <View style={[styles.badge, { backgroundColor: rep.passed ? theme.colors.green + '20' : (rep.score !== null ? theme.colors.red + '20' : theme.colors.card2) }]}>
                    <Typography variant="small" style={{ color: rep.passed ? theme.colors.green : (rep.score !== null ? theme.colors.red : theme.colors.t4), fontSize: 10 }}>
                      {rep.passed ? 'PASSED' : (rep.score !== null ? 'FAILED' : 'PENDING')}
                    </Typography>
                  </View>
                </View>
              </Card>
            ))}

            {(!reportData || !reportData.reports || reportData.reports.length === 0) && (
              <Typography variant="caption" style={{ textAlign: 'center', marginTop: 20 }}>No report data available yet.</Typography>
            )}
          </>
        )}
        
        <Spacer h={60} />
      </ScrollView>

      {/* Add Chapter Modal */}
      <ThemedModal 
        visible={addingChapter}
        title="New Chapter"
        message="Enter a title for the new chapter."
        onConfirm={handleAddChapter}
        onCancel={() => setAddingChapter(false)}
        showCancel
      >
        <TextInput 
          style={styles.modalInput}
          placeholder="e.g. Introduction to Safety"
          placeholderTextColor={theme.colors.t4}
          value={newChapterTitle}
          onChangeText={setNewChapterTitle}
          autoFocus
        />
      </ThemedModal>

      {/* Add Material Modal */}
      <ThemedModal 
        visible={addingMaterial}
        title="Upload Material"
        message={`Uploading: ${uploadForm.file?.name}`}
        onConfirm={handleUpload}
        onCancel={() => setAddingMaterial(false)}
        showCancel
        confirmText={submitting ? "Uploading..." : "Upload"}
      >
        <Typography variant="label" style={{ marginTop: 16 }}>Title</Typography>
        <TextInput 
          style={styles.modalInput}
          placeholder="Material Title"
          placeholderTextColor={theme.colors.t4}
          value={uploadForm.title}
          onChangeText={(t) => setUploadForm(f => ({ ...f, title: t }))}
        />
        
        <Typography variant="label" style={{ marginTop: 16 }}>Release Phase</Typography>
        <View style={styles.pickerContainer}>
          <RNPickerSelect
            onValueChange={(v) => setUploadForm(f => ({ ...f, phase: v }))}
            value={uploadForm.phase}
            items={[
              { label: 'Pre-Session', value: 'pre' },
              { label: 'During Session', value: 'live' },
              { label: 'Post-Session', value: 'post' }
            ]}
            style={{
              inputIOS: styles.pickerInput,
              inputAndroid: styles.pickerInput,
              placeholder: { color: theme.colors.t4 }
            }}
          />
        </View>
      </ThemedModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, flexDirection: 'row', alignItems: 'center' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: theme.colors.acc },
  tabText: { color: theme.colors.t4, fontWeight: '700' },
  tabTextActive: { color: theme.colors.acc },
  scroll: { padding: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chapterCard: { padding: 16, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  matItem: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 12 },
  addMatBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 12 },
  emptyCard: { padding: 40, alignItems: 'center', backgroundColor: 'transparent', borderStyle: 'dashed', borderWidth: 1, borderColor: theme.colors.border },
  testCard: { padding: 16, marginBottom: 12 },
  enrolleeCard: { padding: 12, marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  testPuck: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.card2,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  testPuckActive: {
    backgroundColor: theme.colors.acc,
    borderColor: theme.colors.acc
  },
  modalInput: { 
    backgroundColor: theme.colors.card2, 
    color: theme.colors.t1, 
    borderRadius: 10, 
    paddingHorizontal: 12, 
    height: 48, 
    marginTop: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  pickerContainer: {
    backgroundColor: theme.colors.card2,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: 48,
    justifyContent: 'center'
  },
  pickerInput: {
    color: theme.colors.t1,
    paddingHorizontal: 12,
    fontSize: 16,
    height: 48,
  }
});
