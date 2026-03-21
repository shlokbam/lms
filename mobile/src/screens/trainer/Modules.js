import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, RefreshControl, Modal, Alert, Text } from 'react-native';
import { theme } from '../../theme/theme';
import { Typography, Card, Spacer, PremiumLoading, Button, ThemedModal, ThemedPicker } from '../../components/UI';
import { Search, Filter, Calendar, Users, Layers, ChevronRight, Video, Clock, Plus, BarChart2, Edit3, Trash2 } from 'lucide-react-native';
import api from '../../api/api';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TrainingModules() {
  const [modules, setModules] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Scheduling State
  const [schedulingMod, setSchedulingMod] = useState(null);
  const [scheduleData, setScheduleData] = useState({
    start_datetime: '',
    end_datetime: '',
    meet_link: '',
    training_type: 'virtual',
    status: 'draft'
  });
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [creatingMod, setCreatingMod] = useState(false);
  const [newModData, setNewModData] = useState({ title: '', description: '', category: 'General', trainee_ids: [] });
  const [traineeList, setTraineeList] = useState([]);
  const [traineeSearch, setTraineeSearch] = useState('');
  const [showPicker, setShowPicker] = useState({ show: false, field: null, mode: 'date' });

  const formatDateForBackend = (date) => {
    if (!date) return '';
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const formatDateForDisplay = (str) => {
    if (!str) return 'Select...';
    const d = new Date(str.replace(' ', 'T'));
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  const navigation = useNavigation();

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const res = await api.get('/api/trainer/modules');
      setModules(res.data.modules);
      setStats(res.data.mod_stats);
      
      const tRes = await api.get('/api/trainer/trainees');
      setTraineeList(tRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openSchedule = (mod) => {
    setSchedulingMod(mod);
    setScheduleData({
      start_datetime: mod.start_datetime ? mod.start_datetime.slice(0, 16) : '',
      end_datetime: mod.end_datetime ? mod.end_datetime.slice(0, 16) : '',
      meet_link: mod.meet_link || '',
      training_type: mod.training_type || 'virtual',
      status: mod.status || 'draft'
    });
  };

  const handleSchedule = async () => {
    if (!scheduleData.start_datetime || !scheduleData.end_datetime) {
      alert("Please enter start and end times.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/api/trainer/module/${schedulingMod.id}/schedule`, {
        ...scheduleData,
        start_datetime: scheduleData.start_datetime + ":00",
        end_datetime: scheduleData.end_datetime + ":00"
      });
      setNotice({ title: 'Success', message: 'Module scheduled successfully!' });
      setSchedulingMod(null);
      fetchModules();
    } catch (e) {
      alert(e.response?.data?.detail || "Failed to schedule module");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateModule = async () => {
    if (!newModData.title.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/api/trainer/module/create', newModData);
      setCreatingMod(false);
      setNewModData({ title: '', description: '', category: 'General', trainee_ids: [] });
      fetchModules();
      setNotice({ title: 'Success', message: 'Module created and trainees enrolled!' });
    } catch (e) {
      alert(e.response?.data?.detail || "Failed to create module");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTrainee = (id) => {
    setNewModData(prev => {
      const ids = prev.trainee_ids.includes(id) 
        ? prev.trainee_ids.filter(x => x !== id)
        : [...prev.trainee_ids, id]
      return { ...prev, trainee_ids: ids }
    });
  };

  const getStatus = (start, end) => {
    if (!start) return { label: 'Upcoming', color: theme.colors.info };
    const now = new Date();
    const st = new Date(start);
    const en = end ? new Date(end) : null;
    if (st > now) return { label: 'Upcoming', color: theme.colors.info };
    if (en && en < now) return { label: 'Ended', color: theme.colors.t4 };
    return { label: 'Live', color: theme.colors.red };
  };

  const filteredModules = modules.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
    if (filter === 'all') return matchesSearch;
    const status = getStatus(m.start_datetime, m.end_datetime).label.toLowerCase();
    return matchesSearch && status === filter;
  });

  if (loading) return <PremiumLoading message="Loading Modules..." />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Typography variant="h1" style={{ marginBottom: 0 }}>Modules</Typography>
          <Button 
            title="Create" 
            variant="primary" 
            size="small" 
            onPress={() => setCreatingMod(true)}
            icon={<Plus size={16} color="#fff" />}
          />
        </View>
        
        <View style={styles.searchContainer}>
          <Search size={18} color={theme.colors.t4} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search modules..."
            placeholderTextColor={theme.colors.t4}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ gap: 8 }}>
          {['all', 'live', 'upcoming', 'ended'].map(f => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Typography variant="small" style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.toUpperCase()}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchModules(); }} tintColor={theme.colors.acc} />}
      >
        {filteredModules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Typography variant="body" style={{ color: theme.colors.t4 }}>No modules found</Typography>
          </View>
        ) : (
          filteredModules.map(mod => {
            const formatDate = (dateStr) => {
              if (!dateStr) return '';
              const d = new Date(dateStr);
              return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + 
                     d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
            };

            const getStatus = () => {
              const now = new Date();
              const start = mod.start_datetime ? new Date(mod.start_datetime) : null;
              const end = mod.end_datetime ? new Date(mod.end_datetime) : null;
              
              if (start && now < start) return { label: 'Upcoming', color: theme.colors.amber };
              if (end && now > end) return { label: 'Ended', color: theme.colors.red };
              return { label: 'Live', color: theme.colors.green };
            };
            const status = getStatus();

            return (
              <Card key={mod.id} style={styles.modCard}>
                <View style={[styles.modHeader, { justifyContent: 'space-between', marginBottom: 4 }]}>
                   <Typography variant="small" style={{ color: theme.colors.acc, fontWeight: '800', letterSpacing: 1 }}>
                     {(mod.category || 'GENERAL').toUpperCase()}
                   </Typography>
                   <Typography variant="small" style={{ color: theme.colors.t4 }}>ID: {mod.id}</Typography>
                </View>

                <Typography variant="h2" style={{ marginBottom: 6 }}>{mod.title}</Typography>
                
                {mod.description ? (
                  <Typography variant="body" numberOfLines={2} style={{ color: theme.colors.t3, marginBottom: 12 }}>
                    {mod.description}
                  </Typography>
                ) : null}

                <View style={styles.badgeRow}>
                  <View style={[styles.statusBadge, { backgroundColor: status.color + '20', borderColor: status.color }]}>
                    <Typography variant="small" style={{ color: status.color, fontWeight: '700', fontSize: 10 }}>
                      {status.label.toUpperCase()}
                    </Typography>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: theme.colors.acc + '15', borderColor: theme.colors.acc }]}>
                    <Typography variant="small" style={{ color: theme.colors.acc, fontWeight: '700', fontSize: 10 }}>
                      {(mod.training_type || 'Self-Paced').toUpperCase()}
                    </Typography>
                  </View>
                </View>

                <Spacer h={12} />
                
                {mod.start_datetime && (
                  <View style={styles.dateRow}>
                    <Clock size={12} color={theme.colors.t4} />
                    <Typography variant="small" style={styles.dateText}>
                      {formatDate(mod.start_datetime)}
                    </Typography>
                  </View>
                )}

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openSchedule(mod)}>
                    <Calendar size={20} color={theme.colors.acc} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ModuleReports', { moduleId: mod.id })}>
                    <BarChart2 size={20} color={theme.colors.green} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ModuleDetail', { moduleId: mod.id })}>
                    <Edit3 size={20} color={theme.colors.sky} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { borderRightWidth: 0 }]} 
                    onPress={() => {
                      Alert.alert("Delete Module", "Permanent action. Are you sure?", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: async () => {
                          try {
                            await api.delete(`/api/trainer/module/${mod.id}`);
                            fetchModules();
                          } catch (e) { alert("Failed to delete module"); }
                        }}
                      ]);
                    }}
                  >
                    <Trash2 size={20} color={theme.colors.red} />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
        <Spacer h={40} />
      </ScrollView>

      {/* Scheduling Modal */}
      <ThemedModal
        visible={!!schedulingMod}
        onClose={() => setSchedulingMod(null)}
        title="Schedule Module"
        confirmText={submitting ? "Saving..." : "Save"}
        onConfirm={handleSchedule}
        confirmDisabled={submitting}
      >
        <Typography variant="caption" style={{ marginBottom: 20 }}>
          Setting availability for {schedulingMod?.title}
        </Typography>
        
        <Typography variant="label">Start Time</Typography>
        <TouchableOpacity 
          style={styles.modalInput} 
          onPress={() => setShowPicker({ show: true, field: 'start_datetime', mode: 'date' })}
        >
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Typography style={{ color: scheduleData.start_datetime ? '#fff' : theme.colors.t4, fontSize: 13 }}>
              {formatDateForDisplay(scheduleData.start_datetime)}
            </Typography>
          </View>
        </TouchableOpacity>

        <Typography variant="label">End Time</Typography>
        <TouchableOpacity 
          style={styles.modalInput} 
          onPress={() => setShowPicker({ show: true, field: 'end_datetime', mode: 'date' })}
        >
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Typography style={{ color: scheduleData.end_datetime ? '#fff' : theme.colors.t4, fontSize: 13 }}>
              {formatDateForDisplay(scheduleData.end_datetime)}
            </Typography>
          </View>
        </TouchableOpacity>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <ThemedPicker
              label="Status"
              value={scheduleData.status}
              onValueChange={(v) => setScheduleData(prev => ({...prev, status: v}))}
              items={[
                { label: 'Published', value: 'published' },
                { label: 'Draft', value: 'draft' }
              ]}
            />
          </View>
          <Spacer w={12} />
          <View style={{ flex: 1 }}>
            <ThemedPicker
              label="Type"
              value={scheduleData.training_type}
              onValueChange={(v) => setScheduleData(prev => ({...prev, training_type: v}))}
              items={[
                { label: 'Self-paced', value: 'self_paced' },
                { label: 'Virtual', value: 'virtual' },
                { label: 'Classroom', value: 'classroom' }
              ]}
            />
          </View>
        </View>

        <Typography variant="label">Meeting Link (Opt)</Typography>
        <TextInput 
          style={styles.modalInput}
          value={scheduleData.meet_link}
          onChangeText={(t) => setScheduleData(prev => ({...prev, meet_link: t}))}
          placeholder="https://meet.google.com/..."
          placeholderTextColor={theme.colors.t4}
        />
      </ThemedModal>

      <ThemedModal 
        visible={!!notice}
        title={notice?.title}
        message={notice?.message}
        onConfirm={() => setNotice(null)}
      />

      {/* Create Module Modal */}
      <ThemedModal 
        visible={creatingMod}
        title="Create New Module"
        message="Enter the details for the new training module."
        onConfirm={handleCreateModule}
        onClose={() => setCreatingMod(false)}
        confirmText={submitting ? "Creating..." : "Create"}
      >
        <Typography variant="label" style={{ marginTop: 16 }}>Title *</Typography>
        <TextInput 
          style={styles.modalInput}
          placeholder="e.g. Advanced Safety Protocols"
          placeholderTextColor={theme.colors.t4}
          value={newModData.title}
          onChangeText={(t) => setNewModData(prev => ({...prev, title: t}))}
        />
        <Typography variant="label" style={{ marginTop: 8 }}>Description</Typography>
        <TextInput 
          style={[styles.modalInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
          placeholder="Brief overview of the module"
          placeholderTextColor={theme.colors.t4}
          value={newModData.description}
          onChangeText={(t) => setNewModData(prev => ({...prev, description: t}))}
          multiline
        />
        <Typography variant="label" style={{ marginTop: 8 }}>Category</Typography>
        <TextInput 
          style={styles.modalInput}
          placeholder="e.g. Safety, Technical, Soft Skills"
          placeholderTextColor={theme.colors.t4}
          value={newModData.category}
          onChangeText={(t) => setNewModData(prev => ({...prev, category: t}))}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 8 }}>
          <Typography variant="label" style={{ marginBottom: 0 }}>Enroll Trainees ({newModData.trainee_ids.length})</Typography>
          <TouchableOpacity onPress={() => {
            const allIds = traineeList.map(t => t.id);
            setNewModData(p => ({ ...p, trainee_ids: p.trainee_ids.length === allIds.length ? [] : allIds }));
          }}>
            <Typography variant="small" style={{ color: theme.colors.acc, fontWeight: '700' }}>
              {newModData.trainee_ids.length === traineeList.length ? 'DESELECT ALL' : 'SELECT ALL'}
            </Typography>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchContainer, { height: 40, marginBottom: 12, backgroundColor: theme.colors.card2 }]}>
          <Search size={14} color={theme.colors.t4} />
          <TextInput 
            style={[styles.searchInput, { fontSize: 13 }]} 
            placeholder="Search trainees..." 
            placeholderTextColor={theme.colors.t4}
            value={traineeSearch}
            onChangeText={setTraineeSearch}
          />
        </View>

        <View style={{ maxHeight: 250, backgroundColor: theme.colors.card2, borderRadius: 12, padding: 8, marginBottom: 16 }}>
          {traineeList.filter(t => t.name.toLowerCase().includes(traineeSearch.toLowerCase()) || (t.department && t.department.toLowerCase().includes(traineeSearch.toLowerCase()))).map(t => {
            const isSelected = newModData.trainee_ids.includes(t.id);
            return (
              <TouchableOpacity 
                key={t.id} 
                onPress={() => toggleTrainee(t.id)}
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  paddingVertical: 10, 
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  backgroundColor: isSelected ? theme.colors.acc + '15' : 'transparent',
                  marginBottom: 4
                }}
              >
                <View style={{ 
                  width: 20, height: 20, borderRadius: 6, borderWidth: 2, 
                  borderColor: isSelected ? theme.colors.acc : theme.colors.t4,
                  backgroundColor: isSelected ? theme.colors.acc : 'transparent',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  {isSelected && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text>}
                </View>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center', marginLeft: 12 }}>
                   <Typography style={{ fontSize: 12, fontWeight: '700', color: theme.colors.t2 }}><Text>{t.name[0]}</Text></Typography>
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Typography variant="body" style={{ fontWeight: isSelected ? '700' : '500', color: isSelected ? theme.colors.acc : theme.colors.t1 }}>
                    <Text style={{ fontSize: 14 }}>{t.name}</Text>
                  </Typography>
                  <Typography variant="small" style={{ color: theme.colors.t4 }}>
                    <Text style={{ fontSize: 11 }}>{t.department || 'N/A'}</Text>
                  </Typography>
                </View>
              </TouchableOpacity>
            );
          })}
          {traineeList.length === 0 && (
             <Typography variant="small" style={{ textAlign: 'center', padding: 20, color: theme.colors.t4 }}><Text>No trainees available</Text></Typography>
          )}
        </View>
      </ThemedModal>

      {showPicker.show && (
      <DateTimePicker
        value={scheduleData[showPicker.field] ? new Date(scheduleData[showPicker.field].replace(' ', 'T')) : new Date()}
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
            setScheduleData(f => ({ ...f, [showPicker.field]: formatDateForBackend(currentDate) }));
          } else {
            setShowPicker({ show: false, field: null, mode: 'date' });
            setScheduleData(f => ({ ...f, [showPicker.field]: formatDateForBackend(currentDate) }));
          }
        }}
      />
    )}
  </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16, backgroundColor: theme.colors.bg },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.colors.card, 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  searchInput: { flex: 1, marginLeft: 10, color: theme.colors.t1, fontSize: 16 },
  filterBar: { marginTop: 16, flexDirection: 'row' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border },
  filterChipActive: { backgroundColor: theme.colors.acc, borderColor: theme.colors.acc },
  filterText: { color: theme.colors.t3, fontWeight: '700' },
  filterTextActive: { color: '#fff' },
  scroll: { padding: 24 },
  modCard: { padding: 20, marginBottom: 16 },
  modHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  emptyContainer: { padding: 60, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 },
  modalCard: { padding: 24 },
  modalInput: { 
    backgroundColor: theme.colors.card2, 
    color: theme.colors.t1, 
    borderRadius: 10, 
    paddingHorizontal: 12, 
    height: 44, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  badgeRow: { flexDirection: 'row', gap: 8 },
  statusBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8, 
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateText: { color: theme.colors.t4, marginLeft: 8, fontSize: 13 },
  deleteBtn: {
    width: 44,
    height: 44,
    backgroundColor: theme.colors.red + '15',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.red + '30'
  },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionRow: { 
    flexDirection: 'row', 
    borderTopWidth: 1, 
    borderTopColor: theme.colors.border, 
    marginTop: 16,
    marginHorizontal: -20,
    marginBottom: -20
  },
  actionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border
  },
  row: { flexDirection: 'row', alignItems: 'center' }
});
