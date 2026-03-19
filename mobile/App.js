import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { theme } from './src/theme/theme';

// Screens
import Login from './src/screens/auth/Login';
import Register from './src/screens/auth/Register';
import TraineeDashboard from './src/screens/trainee/Dashboard';
import ModuleDetail from './src/screens/trainee/ModuleDetail';
import TakeTest from './src/screens/trainee/TakeTest';
import Profile from './src/screens/trainee/Profile';
import Notifications from './src/screens/trainee/Notifications';
import Calendar from './src/screens/trainee/Calendar';
import TestResult from './src/screens/trainee/TestResult';
import DocumentViewer from './src/screens/trainee/DocumentViewer';

const Stack = createStackNavigator();

function Navigation() {
  const { user, loading } = useAuth();

  if (loading) return null; // Or a splash screen

  return (
    <Stack.Navigator screenOptions={{ 
      headerShown: false,
      cardStyle: { backgroundColor: theme.colors.bg }
    }}>
      {user ? (
        <>
          <Stack.Screen name="Dashboard" component={TraineeDashboard} />
          <Stack.Screen name="ModuleDetail" component={ModuleDetail} />
          <Stack.Screen name="TakeTest" component={TakeTest} />
          <Stack.Screen name="Profile" component={Profile} />
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
  return (
    <AuthProvider>
      <NavigationContainer>
        <Navigation />
      </NavigationContainer>
    </AuthProvider>
  );
}
