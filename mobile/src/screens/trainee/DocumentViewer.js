import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Dimensions,
  Linking
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';
import { theme } from '../../theme/theme';
import { Typography, Button, ThemedModal, PremiumLoading } from '../../components/UI';
import { Spacer } from '../../components/Form';
import { ChevronLeft, ExternalLink, Download, CheckCircle } from 'lucide-react-native';
import api, { BASE_URL } from '../../api/api';

const { width } = Dimensions.get('window');

export default function DocumentViewer({ route, navigation }) {
  const { material, moduleId } = route.params;
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [token, setToken] = useState(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    getToken();
  }, []);

  const getToken = async () => {
    try {
      const t = await SecureStore.getItemAsync('token');
      setToken(t);
    } catch (e) {
      console.error("Token error", e);
    } finally {
      setLoading(false);
    }
  };

  const fileUrl = token
    ? `${BASE_URL}/uploads/${material.file_path}?token=${token}`
    : null;

  const handleMarkAsCompleted = async () => {
    try {
      await api.post(`/api/progress/update`, {
        module_id: moduleId,
        material_id: material.id,
        completed: true,
        watch_percent: 100
      });
      setCompleted(true);
      setNotice({ title: 'Success', message: 'Material marked as completed!' });
    } catch (e) {
      console.error(e.response?.data);
      setNotice({ title: 'Error', message: 'Failed to update progress' });
    }
  };

  const downloadAndShare = async () => {
    if (!fileUrl) return;
    try {
      const supported = await Linking.canOpenURL(fileUrl);
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        // Just try
        await Linking.openURL(fileUrl);
      }
    } catch (e) {
      setNotice({ title: 'Error', message: 'Failed to open document' });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={theme.colors.t1} />
        </TouchableOpacity>
        <Typography variant="h3" style={{ flex: 1, marginBottom: 0 }} numberOfLines={1}>
          {material.title}
        </Typography>
      </View>

      <View style={styles.content}>
        {loading && <PremiumLoading message="Preparing Material..." />}

        {!loading && (
          <View style={styles.viewer}>
            {material.file_type === 'video' ? (
              <View style={styles.videoContainer}>
                <Video
                  style={styles.video}
                  source={{ uri: fileUrl }}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping={false}
                  onLoad={() => setLoading(false)}
                  onError={(e) => console.log('Video Error:', e)}
                />
              </View>
            ) : (
              <View style={styles.pdfState}>
                <ExternalLink size={64} color={theme.colors.acc} style={{ marginBottom: 20 }} />
                <Typography variant="h2" style={{ textAlign: 'center' }}>{material.file_type.toUpperCase()} Document</Typography>
                <Typography variant="caption" style={{ textAlign: 'center', maxWidth: '80%', marginBottom: 30 }}>
                  This document ({material.title}) will be opened in your system's default viewer.
                </Typography>

                <Button
                  title={loading || !token ? "Loading..." : "Open Document"}
                  onPress={downloadAndShare}
                  disabled={loading || !token}
                />
              </View>
            )}

            <Spacer h={24} />

            {!completed ? (
              <Button
                title="Mark as Completed"
                variant="outline"
                onPress={handleMarkAsCompleted}
              />
            ) : (
              <View style={styles.completedBadge}>
                <CheckCircle size={20} color={theme.colors.green} />
                <Typography variant="body" style={{ color: theme.colors.green, fontWeight: '700' }}>
                  Completed
                </Typography>
              </View>
            )}
          </View>
        )}
      </View>

      <ThemedModal
        visible={!!notice}
        title={notice?.title}
        message={notice?.message}
        onConfirm={() => {
          setNotice(null);
          if (notice?.title === 'Error') navigation.goBack();
        }}
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
  content: {
    flex: 1,
    padding: 20,
  },
  viewer: {
    flex: 1,
    justifyContent: 'center',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
  },
  pdfState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: theme.colors.greenBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.green + '40',
  }
});
