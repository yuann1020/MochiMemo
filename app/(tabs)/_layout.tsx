import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radii } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors      = Colors[colorScheme];

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
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.addBtn, focused ? styles.addBtnActive : styles.addBtnIdle]}>
              <IconSymbol
                size={20}
                name="plus"
                color={focused ? '#ffffff' : color}
              />
            </View>
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

const styles = StyleSheet.create({
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
  addBtn: {
    width:          44,
    height:         44,
    borderRadius:   Radii.full,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   4,
  },
  addBtnActive: {
    backgroundColor: '#F472B6',
    shadowColor:     '#F472B6',
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.70,
    shadowRadius:    16,
    elevation:       8,
  },
  addBtnIdle: {
    backgroundColor: 'rgba(244,114,182,0.10)',
    borderWidth:     1,
    borderColor:     'rgba(167,139,250,0.22)',
  },
});
