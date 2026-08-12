import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from './src/db/database';
import { hasProfile } from './src/db/userProfileDao';
import RootNavigator from './src/navigation/RootNavigator';
import { onDataCleared } from './src/utils/events';
import { colors } from './src/theme/theme';

export default function App() {
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    // 数据被清除后回到引导页
    const off = onDataCleared(() => setNeedsOnboarding(true));
    (async () => {
      try {
        await initDatabase();
        setNeedsOnboarding(!(await hasProfile()));
      } catch (e) {
        console.warn('初始化失败', e);
      } finally {
        setReady(true);
      }
    })();
    return off;
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      {!ready ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <RootNavigator
            needsOnboarding={needsOnboarding}
            onOnboardingDone={() => setNeedsOnboarding(false)}
          />
        </SafeAreaProvider>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});

