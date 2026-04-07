import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from './src/theme';
import { HomeScreen } from './src/screens/HomeScreen';
import { ThemesScreen } from './src/screens/ThemesScreen';
import { AnalysesScreen } from './src/screens/AnalysesScreen';
import { AppsScreen } from './src/screens/AppsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { GlobalDetailScreen } from './src/screens/GlobalDetailScreen';
import { WelcomeScreen } from './src/screens/OnboardingWelcome';
import { OnboardingGoals } from './src/screens/OnboardingGoals';
import { OnboardingPermissions } from './src/screens/OnboardingPermissions';
import { PairingScreen } from './src/screens/PairingScreen';
import { MiniAppContainer } from './src/miniapps/MiniAppContainer';
import { 
  Home as HomeIcon, 
  Brain, 
  Database, 
  LayoutGrid, 
  User 
} from 'lucide-react-native';



const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          display: 'none'
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarIcon: ({ color, size }: { color: string, size: number }) => {
          if (route.name === 'Home') return <HomeIcon size={size} color={color} />;
          if (route.name === 'Temas') return <Brain size={size} color={color} />;
          if (route.name === 'Dados') return <Database size={size} color={color} />;
          if (route.name === 'Apps') return <LayoutGrid size={size} color={color} />;
          return null;
        },
      })}
    >
      <Tab.Screen name="Dados" component={AnalysesScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Temas" component={ThemesScreen} />
      <Tab.Screen name="Apps" component={AppsScreen} />
    </Tab.Navigator>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorStr: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorStr: error?.toString() || 'Unknown Error' };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: 'red', padding: 24, justifyContent: 'center' }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>CRASH:</Text>
          <Text style={{ color: 'white', marginTop: 10 }}>{this.state.errorStr}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

import { View, Text } from 'react-native';

export default function App() {
  return (
    <ErrorBoundary>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Main">
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="OnboardingGoals" component={OnboardingGoals} />
          <Stack.Screen name="OnboardingPermissions" component={OnboardingPermissions} />
          <Stack.Screen name="Pairing" component={PairingScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="GlobalDetail" component={GlobalDetailScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ presentation: 'modal' }} 
          />
          <Stack.Screen
            name="MiniApp"
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          >
            {({ route, navigation }: any) => (
              <MiniAppContainer app={(route.params as any).app} navigation={navigation} />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}
