import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Layout
import Layout from './components/Layout'

// Trainer pages
import TrainerDashboard from './pages/trainer/Dashboard'
import TrainerModules from './pages/trainer/Modules'
import TrainerModuleDetail from './pages/trainer/ModuleDetail'
import CreateTest from './pages/trainer/CreateTest'
import EditTest from './pages/trainer/EditTest'
import Reports from './pages/trainer/Reports'
import Trainees from './pages/trainer/Trainees'

// Trainee pages
import TraineeDashboard from './pages/trainee/Dashboard'
import TraineeModule from './pages/trainee/Module'
import TakeTest from './pages/trainee/TakeTest'
import TestResult from './pages/trainee/TestResult'
import Profile from './pages/trainee/Profile'
import Calendar from './pages/trainee/Calendar'
import Notifications from './pages/Notifications'

function RequireAuth({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={user.role === 'trainer' ? '/trainer/dashboard' : '/trainee/dashboard'} replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Trainer */}
          <Route path="/trainer" element={<RequireAuth role="trainer"><Layout /></RequireAuth>}>
            <Route path="dashboard" element={<TrainerDashboard />} />
            <Route path="modules" element={<TrainerModules />} />
            <Route path="module/:moduleId" element={<TrainerModuleDetail />} />
            <Route path="module/:moduleId/test/create" element={<CreateTest />} />
            <Route path="module/:moduleId/test/:testId/edit" element={<EditTest />} />
            <Route path="module/:moduleId/reports" element={<Reports />} />
            <Route path="trainees" element={<Trainees />} />
          </Route>

          {/* Trainee */}
          <Route path="/trainee" element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="dashboard" element={<TraineeDashboard />} />
            <Route path="module/:moduleId" element={<TraineeModule />} />
            <Route path="test/:testId" element={<TakeTest />} />
            <Route path="test/:testId/result" element={<TestResult />} />
            <Route path="profile" element={<Profile />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
