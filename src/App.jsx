import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage       from './pages/AuthPage';
import Dashboard      from './pages/Dashboard';
import SearchPlayers  from './pages/SearchPlayers';
import Games          from './pages/Games';
import CreateGame     from './pages/CreateGame';
import GameDetail     from './pages/GameDetail';
import Messages       from './pages/Messages';
import Conversation   from './pages/Conversation';
import Profile        from './pages/Profile';
import Clubs          from './pages/Clubs';
import Friends        from './pages/Friends';
import Reviews        from './pages/Reviews';
import ResetPassword  from './pages/ResetPassword';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', fontSize:24 }}>⏳</div>;
  return user ? children : <Navigate to="/auth" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth"            element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          <Route path="/dashboard"       element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/search"          element={<PrivateRoute><SearchPlayers /></PrivateRoute>} />
          <Route path="/games"           element={<PrivateRoute><Games /></PrivateRoute>} />
          <Route path="/games/create"    element={<PrivateRoute><CreateGame /></PrivateRoute>} />
          <Route path="/games/:id"       element={<PrivateRoute><GameDetail /></PrivateRoute>} />
          <Route path="/messages"        element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="/messages/:id"    element={<PrivateRoute><Conversation /></PrivateRoute>} />
          <Route path="/profile/:id"     element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/clubs"           element={<PrivateRoute><Clubs /></PrivateRoute>} />
          <Route path="/friends"         element={<PrivateRoute><Friends /></PrivateRoute>} />
          <Route path="/reviews/:id"     element={<PrivateRoute><Reviews /></PrivateRoute>} />
          <Route path="*"                element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
