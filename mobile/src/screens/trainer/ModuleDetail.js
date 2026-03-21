import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, TextInput } from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Card, Spacer, PremiumLoading, Button, ThemedModal, ThemedPicker } from '../../components/UI';
import { ChevronLeft, Plus, Trash2, FileText, Video, Layers, Beaker, Calendar, Upload, BarChart2 } from 'lucide-react-native';
import api from '../../api/api';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [schedModal, setSchedModal] = useState(false);
  const [schedForm, setSchedForm] = useState({ 
    start_datetime: '', 
    end_datetime: '', 
    status: 'published', 
    color: '#3B5BDB', 
    training_type: 'self_paced', 
    meet_link: '' 
  });
  const [showPicker, setShowPicker] = useState({ show: false, field: null, mode: 'date' });
  const [reportData, setReportData] = useState(null);

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
      
      // Also fetch reports if available
      try {
        const repRes = await api.get(`/api/trainer/module/${moduleId}/reports`);
        setReportData(repRes.data);
      } catch (err) {
        console.log("No reports or failed to load reports:", err.message);
      }
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

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setUploadForm(f => ({
          ...f,
          title: f.title || file.name,
          file: file
        }));
      }
    } catch (err) {
      console.error(err);
      alert("Error picking file");
    }
  };

  const openUploadModal = (chapterId = null) => {
    setUploadForm({ title: '', phase: 'pre', chapter_id: chapterId, file: null });
    setAddingMaterial(true);
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

  const handleSaveSchedule = async () => {
    setSubmitting(true);
    try {
      await api.post(`/api/trainer/module/${moduleId}/schedule`, schedForm);
      setSchedModal(false);
      fetchDetail();
    } catch (e) {
      alert("Failed to save schedule");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (data?.module && schedModal) {
      const m = data.module;
      setSchedForm({
        start_datetime: m.start_datetime ? m.start_datetime.slice(0, 16) : '',
        end_datetime: m.end_datetime ? m.end_datetime.slice(0, 16) : '',
        status: m.status || 'published',
        color: m.color || '#3B5BDB',
        training_type: m.training_type || 'self_paced',
        meet_link: m.meet_link || ''
      });
    }
  }, [schedModal, data]);

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
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.iconButton} onPress={() => setAddingChapter(true)}>
                  <Plus size={20} color={theme.colors.acc} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={() => openUploadModal()}>
                  <Upload size={20} color={theme.colors.acc} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={() => setSchedModal(true)}>
                  <Calendar size={20} color={theme.colors.acc} />
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
                    <TouchableOpacity style={styles.addMatBtn} onPress={() => openUploadModal(ch.id)}>
                      <Plus size={14} color={theme.colors.acc} />
                      <Typography variant="small" style={{ color: theme.colors.acc, marginLeft: 4 }}>Add Material</Typography>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}

            {/* Uncategorized Materials */}
            {mat_by_chapter["0"] && mat_by_chapter["0"].length > 0 && (
              <>
                <Spacer h={24} />
                <Typography variant="h3" style={{ marginBottom: 12, color: theme.colors.t4 }}>Uncategorized Materials</Typography>
                <Card style={{ padding: 8 }}>
                   {mat_by_chapter["0"].map(mat => (
                    <View key={mat.id} style={[styles.matItem, { paddingVertical: 8 }]}>
                      {mat.file_type === 'video' ? <Video size={14} color={theme.colors.t3} /> : <FileText size={14} color={theme.colors.t3} />}
                      <Typography variant="small" style={{ flex: 1, marginLeft: 12, color: theme.colors.t3 }}>{mat.title}</Typography>
                      <TouchableOpacity onPress={() => deleteMaterial(null, mat.id)}>
                        <Trash2 size={14} color={theme.colors.red} style={{ opacity: 0.6 }} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </Card>
              </>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <BarChart2 size={24} color={theme.colors.green} />
              <Typography variant="h2" style={{ marginBottom: 0 }}>Test Performance</Typography>
            </View>
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
        onClose={() => setAddingChapter(false)}
        title="Add Chapter"
        onConfirm={handleAddChapter}
        confirmText={submitting ? "Adding..." : "Add Chapter"}
        confirmDisabled={submitting || !newChapterTitle.trim()}
      >
        <Typography variant="label">Chapter Title *</Typography>
        <TextInput
          style={styles.input}
          placeholder="e.g., Introduction & Overview"
          placeholderTextColor={theme.colors.t4}
          value={newChapterTitle}
          onChangeText={setNewChapterTitle}
        />
      </ThemedModal>

      {/* Add Material Modal */}
      <ThemedModal
        visible={addingMaterial}
        onClose={() => setAddingMaterial(false)}
        title="Upload Material"
        onConfirm={handleUpload}
        confirmText={submitting ? "Uploading..." : "↑ Upload File"}
        confirmDisabled={!uploadForm.file || submitting}
      >
        <Typography variant="label" style={{ fontSize: 10, fontWeight: '700', color: theme.colors.t4, textTransform: 'uppercase' }}>File *</Typography>
        <TouchableOpacity 
          style={[styles.webLikeFilePicker, uploadForm.file && styles.webLikeFilePickerActive]} 
          onPress={pickFile}
        >
          <View style={styles.chooseFileBtn}>
            <Typography style={{ color: theme.colors.t2, fontSize: 13, fontWeight: '700' }}>Choose file</Typography>
          </View>
          <Typography variant="body" style={{ marginLeft: 10, color: uploadForm.file ? theme.colors.t1 : theme.colors.t4, flex: 1, fontSize: 13 }} numberOfLines={1}>
            {uploadForm.file ? uploadForm.file.name : "No file chosen"}
          </Typography>
        </TouchableOpacity>

        <Typography variant="label" style={{ marginTop: 16, fontSize: 10, fontWeight: '700', color: theme.colors.t4, textTransform: 'uppercase' }}>Title</Typography>
        <TextInput
          style={styles.webLikeInput}
          placeholder="Display name (optional)"
          placeholderTextColor={theme.colors.t4}
          value={uploadForm.title}
          onChangeText={(v) => setUploadForm(f => ({ ...f, title: v }))}
        />

        <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <ThemedPicker
              label="Release Phase"
              value={uploadForm.phase}
              onValueChange={(v) => setUploadForm(f => ({ ...f, phase: v }))}
              items={[
                { label: 'Pre-Session', value: 'pre' },
                { label: 'During Session', value: 'live' },
                { label: 'Post-Session', value: 'post' }
              ]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedPicker
              label="Select Chapter"
              value={uploadForm.chapter_id}
              onValueChange={(v) => setUploadForm(prev => ({ ...prev, chapter_id: v }))}
              items={[
                { label: 'None (Uncategorized)', value: null },
                ...chapters.map(c => ({ label: c.title, value: c.id }))
              ]}
            />
          </View>
        </View>
      </ThemedModal>

      {/* Schedule Modal */}
      <ThemedModal
        visible={schedModal}
        onClose={() => setSchedModal(false)}
        title="Schedule Module"
        onConfirm={handleSaveSchedule}
        confirmText={submitting ? "Saving..." : "Save Schedule"}
      >
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Typography variant="label">Start Date & Time</Typography>
            <TouchableOpacity 
              style={styles.webLikeInput} 
              onPress={() => setShowPicker({ show: true, field: 'start_datetime', mode: 'date' })}
            >
              <Typography style={{ color: schedForm.start_datetime ? '#fff' : theme.colors.t4, fontSize: 13 }}>
                {formatDateForDisplay(schedForm.start_datetime)}
              </Typography>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="label">End Date & Time</Typography>
            <TouchableOpacity 
              style={styles.webLikeInput} 
              onPress={() => setShowPicker({ show: true, field: 'end_datetime', mode: 'date' })}
            >
              <Typography style={{ color: schedForm.end_datetime ? '#fff' : theme.colors.t4, fontSize: 13 }}>
                {formatDateForDisplay(schedForm.end_datetime)}
              </Typography>
            </TouchableOpacity>
          </View>
        </View>

        {showPicker.show && (
          <DateTimePicker
            value={schedForm[showPicker.field] ? new Date(schedForm[showPicker.field]) : new Date()}
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
                // After picking date, pick time
                setShowPicker({ ...showPicker, mode: 'time' });
                setSchedForm(f => ({ ...f, [showPicker.field]: formatDateForBackend(currentDate) }));
              } else {
                // After picking time, close
                setShowPicker({ show: false, field: null, mode: 'date' });
                setSchedForm(f => ({ ...f, [showPicker.field]: formatDateForBackend(currentDate) }));
              }
            }}
          />
        )}

        <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <ThemedPicker
              label="Status"
              value={schedForm.status}
              onValueChange={(v) => setSchedForm(f => ({ ...f, status: v }))}
              items={[
                { label: 'Published', value: 'published' },
                { label: 'Draft', value: 'draft' }
              ]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedPicker
              label="Type"
              value={schedForm.training_type}
              onValueChange={(v) => setSchedForm(f => ({ ...f, training_type: v }))}
              items={[
                { label: 'Self-paced', value: 'self_paced' },
                { label: 'Virtual', value: 'virtual' },
                { label: 'Classroom', value: 'classroom' }
              ]}
            />
          </View>
        </View>

        {schedForm.training_type !== 'self_paced' && (
          <View style={{ marginTop: 16 }}>
            <Typography variant="label">Meeting Link / Location</Typography>
            <TextInput
              style={styles.webLikeInput}
              placeholder="URL or Address"
              value={schedForm.meet_link}
              onChangeText={(v) => setSchedForm(f => ({ ...f, meet_link: v }))}
            />
          </View>
        )}
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
    borderColor: theme.colors.border,
    fontSize: 15
  },
  webLikeInput: {
    backgroundColor: theme.colors.card2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.t1, 
    paddingHorizontal: 12,
    height: 42,
    marginTop: 8,
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8
  },
  iconButton: {
    padding: 8,
    backgroundColor: theme.colors.card2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border
  }
});
