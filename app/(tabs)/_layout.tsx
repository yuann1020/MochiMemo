import { BlurView } from 'expo-blur';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Colors, Radii } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors      = Colors[colorScheme];
  const { initialized, loading, session } = useAuth();

  if (!initialized || loading) {
    return <AuthLoadingScreen />;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown:             false,
        tabBarButton:            HapticTab,
        tabBarActiveTintColor:   colors.accentHi,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarHideOnKeyboard:    true,
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="dark"
            style={[StyleSheet.absoluteFillObject, styles.navBackground]}
          />
        ),
        tabBarStyle:      styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle:  styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={22} name="house.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="record"
        options={{
          title: 'Add',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={22} name="plus" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={22} name="chart.bar.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={22} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function AuthLoadingScreen() {
  const colors = Colors[useColorScheme() ?? 'dark'];

  return (
    <View style={[styles.loadingRoot, { backgroundColor: colors.background }]}>
      <ScreenBackground variant="quiet" />
      <SafeAreaView style={styles.loadingSafe}>
        <ActivityIndicator size="small" color={colors.primaryGlow} />
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          Securing your session...
        </ThemedText>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRoot: { flex: 1 },
  loadingSafe: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  tabBar: {
    position:        'absolute',
    bottom:          14,
    left:            14,
    right:           14,
    height:          72,
    borderRadius:    Radii['3xl'],
    backgroundColor: 'transparent',
    borderTopColor:  'transparent',
    borderTopWidth:  0,
    elevation:       0,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.40,
    shadowRadius:    24,
  },
  navBackground: {
    borderRadius:    Radii['3xl'],
    borderWidth:     1,
    borderColor:     'rgba(167,139,250,0.20)',   // lavender border
    backgroundColor: 'rgba(5,7,22,0.0)',
  },
  tabLabel: {
    fontSize:   10,
    fontWeight: '600',
    marginTop:  -2,
  },
  tabItem: {
    paddingTop:    8,
    paddingBottom: 8,
  },
});
