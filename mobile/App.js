import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { theme } from './src/theme/theme';
import { Home, BookOpen, Calendar as CalIcon, User } from 'lucide-react-native';

// Screens
import Login from './src/screens/auth/Login';
import Register from './src/screens/auth/Register';
import TraineeDashboard from './src/screens/trainee/Dashboard';
import Courses from './src/screens/trainee/Courses';
import Quizzes from './src/screens/trainee/Quizzes';
import ModuleDetail from './src/screens/trainee/ModuleDetail';
import TakeTest from './src/screens/trainee/TakeTest';
import Profile from './src/screens/trainee/Profile';
import Notifications from './src/screens/trainee/Notifications';
import Calendar from './src/screens/trainee/Calendar';
import TestResult from './src/screens/trainee/TestResult';
import DocumentViewer from './src/screens/trainee/DocumentViewer';

// Trainer Screens
import TrainerDashboard from './src/screens/trainer/Dashboard';
import TrainerModules from './src/screens/trainer/Modules';
import TrainerTrainees from './src/screens/trainer/Trainees';
import TrainerModuleDetail from './src/screens/trainer/ModuleDetail';
import CreateEditTest from './src/screens/trainer/CreateEditTest';
import ModuleReports from './src/screens/trainer/ModuleReports';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: 70 + (insets.bottom > 0 ? insets.bottom - 10 : 15),
          paddingTop: 10,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 15,
        },
        tabBarActiveTintColor: theme.colors.acc,
        tabBarInactiveTintColor: theme.colors.t3,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') return <Home size={size} color={color} />;
          if (route.name === 'Courses') return <BookOpen size={size} color={color} />;
          if (route.name === 'Calendar') return <CalIcon size={size} color={color} />;
          if (route.name === 'Profile') return <User size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={TraineeDashboard} options={{ title: 'Home' }} />
      <Tab.Screen name="Courses" component={Courses} options={{ title: 'My Courses' }} />
      <Tab.Screen name="Calendar" component={Calendar} options={{ title: 'Calendar' }} />
      <Tab.Screen name="Profile" component={Profile} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

function TrainerTabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: 70 + (insets.bottom > 0 ? insets.bottom - 10 : 15),
          paddingTop: 10,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 15,
        },
        tabBarActiveTintColor: theme.colors.acc,
        tabBarInactiveTintColor: theme.colors.t3,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') return <Home size={size} color={color} />;
          if (route.name === 'Modules') return <BookOpen size={size} color={color} />;
          if (route.name === 'Trainees') return <User size={size} color={color} />;
          if (route.name === 'Profile') return <User size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={TrainerDashboard} options={{ title: 'Overview' }} />
      <Tab.Screen name="Modules" component={TrainerModules} options={{ title: 'Modules' }} />
      <Tab.Screen name="Trainees" component={TrainerTrainees} options={{ title: 'Trainees' }} />
      <Tab.Screen name="Profile" component={Profile} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

function Navigation() {
  const { user, loading } = useAuth();

  if (loading) return null;

  const isTrainer = user?.role === 'trainer';

  return (
    <Stack.Navigator screenOptions={{ 
      headerShown: false,
      cardStyle: { backgroundColor: theme.colors.bg }
    }}>
      {user ? (
        <>
          <Stack.Screen 
            name="Main" 
            component={isTrainer ? TrainerTabNavigator : TabNavigator} 
          />
          <Stack.Screen 
            name="ModuleDetail" 
            component={isTrainer ? TrainerModuleDetail : ModuleDetail} 
          />
          <Stack.Screen name="CreateEditTest" component={CreateEditTest} />
          <Stack.Screen name="ModuleReports" component={ModuleReports} />
          <Stack.Screen name="TakeTest" component={TakeTest} />
          <Stack.Screen name="Notifications" component={Notifications} />
          <Stack.Screen name="Calendar" component={Calendar} />
          <Stack.Screen name="TestResult" component={TestResult} />
          <Stack.Screen name="DocumentViewer" component={DocumentViewer} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: theme.colors.bg,
      card: theme.colors.card,
      text: theme.colors.t1,
      border: theme.colors.border,
      primary: theme.colors.acc,
    },
  };

  return (
    <AuthProvider>
      <NavigationContainer theme={navTheme}>
        <Navigation />
      </NavigationContainer>
    </AuthProvider>
  );
}
