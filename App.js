import React, { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import * as NavigationBar from 'expo-navigation-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import GAME_HTML from './game/gameHtml';

const SAVE_KEY = 'gloam-save-v1';
const BASE_URL = 'https://gloam.invalid/';
const send = (ref, js) => ref.current && ref.current.injectJavaScript(js + ';true;');

export default function App() {
  useKeepAwake();
  const web = useRef(null);
  const [save, setSave] = useState(undefined); // undefined = still loading

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(SAVE_KEY)
      .then((raw) => alive && setSave(raw ? JSON.parse(raw) : null))
      .catch(() => alive && setSave(null));
    NavigationBar.setVisibilityAsync('hidden').catch(() => {});
    return () => { alive = false; };
  }, []);

  // Android back button opens the in-game pause menu instead of closing the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      send(web, "window.dispatchEvent(new Event('gloam-menu'))");
      return true;
    });
    return () => sub.remove();
  }, []);

  // Pause when the app goes to the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') send(web, "window.dispatchEvent(new Event('gloam-pause'))");
    });
    return () => sub.remove();
  }, []);

  const onMessage = (e) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      if (m.type === 'save') AsyncStorage.setItem(SAVE_KEY, JSON.stringify(m.data)).catch(() => {});
    } catch (err) { /* ignore malformed messages */ }
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      {save !== undefined && (
        <WebView
          ref={web}
          style={styles.web}
          source={{ html: GAME_HTML, baseUrl: BASE_URL }}
          originWhitelist={['*']}
          injectedJavaScriptBeforeContentLoaded={'window.__GLOAM_SAVE__=' + JSON.stringify(save) + ';true;'}
          onMessage={onMessage}
          onShouldStartLoadWithRequest={(r) => r.url.startsWith(BASE_URL) || r.url === 'about:blank'}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          androidLayerType="hardware"
          setSupportMultipleWindows={false}
          allowFileAccess={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050505' },
  web: { flex: 1, backgroundColor: '#050505' },
});
