import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import LiveClass from './pages/LiveClass';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword, { ResetPassword } from './pages/ForgotPassword';
import LiveSessionEnroll from './pages/student/LiveSessionEnroll';
import LoginModal from './pages/LoginModal';
import AdminDashboard from './pages/admin/AdminDashboard';
import Overview from './pages/admin/Overview';
import ManageCourses from './pages/admin/ManageCourses';
import ManageStudents from './pages/admin/ManageStudents';
import Payments from './pages/admin/Payments';
import Notices from './pages/admin/Notices';
import Doubts from './pages/admin/Doubts';
import Reviews from './pages/admin/Reviews';
import ManageLiveSessions from './pages/admin/ManageLiveSessions';
import ManageEnrollments from './pages/admin/ManageEnrollments';
import ManageSubmissions from './pages/admin/ManageSubmissions';
import Reports from './pages/admin/Reports';
import AuditLogs from './pages/admin/AuditLogs';
import StudentDashboard from './pages/student/StudentDashboard';
import MyCourses from './pages/student/MyCourses';
import WatchVideo from './pages/student/WatchVideo';
import Quiz from './pages/student/Quiz';
import Assignments from './pages/student/Assignments';
import WriteReview from './pages/student/WriteReview';
import StudentDoubts from './pages/student/Doubts';
import Notifications from './pages/student/Notifications';
import Profile from './pages/student/Profile';
import StudentNotices from './pages/student/Notices';
import Certificates from './pages/student/Certificates';
import CertificateView from './pages/student/CertificateView';
import TeachingBoard from './pages/student/TeachingBoard';
import Referrals from './pages/student/Referrals';
import CheckoutPage from './pages/student/CheckoutPage';
import PaymentSuccess from './pages/student/PaymentSuccess';
import PaymentHistory from './pages/student/PaymentHistory';
import Chatbot from './components/Chatbot';
import InstallPrompt from './components/InstallPrompt';

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role === 'admin') return <Navigate to="/dashboard/admin" replace />;
  return <Navigate to="/dashboard/student" replace />;
};

const AppContent = () => {
  const [loginModal, setLoginModal] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isCheckout = location.pathname.startsWith('/checkout');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const auth = searchParams.get('auth');
    if (auth === 'session') {
      toast.error('You were logged out because someone signed in from another device.', { duration: 5000 });
    } else if (auth === 'expired') {
      toast.error('Your session expired. Please log in again.', { duration: 5000 });
    }
    if (auth) {
      const next = searchParams;
      next.delete('auth');
      setSearchParams(next, { replace: true });
    }
  }, []);

  return (
    <>
      {!isDashboard && !isCheckout && <Navbar onLoginClick={() => setLoginModal(true)} />}
      <main className={isDashboard || isCheckout ? '' : 'min-h-screen'}>
        <Routes>
          <Route path="/" element={<Home onLoginClick={() => setLoginModal(true)} />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/live-class" element={<LiveClass />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/live-class/enroll/:sessionId" element={
            <ProtectedRoute role="student">
              <LiveSessionEnroll />
            </ProtectedRoute>
          } />
          <Route path="/course/:id" element={<CourseDetail onLoginClick={() => setLoginModal(true)} />} />
          <Route path="/checkout/:courseId" element={
            <ProtectedRoute role="student">
              <CheckoutPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route
            path="/dashboard/student"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<MyCourses />} />
            <Route path="courses" element={<MyCourses />} />
            <Route path="course/:courseId/lesson/:lessonId" element={<WatchVideo />} />
            <Route path="quiz" element={<Quiz />} />
            <Route path="quiz/:lessonId" element={<Quiz />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="doubts" element={<StudentDoubts />} />
            <Route path="notices" element={<StudentNotices />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="certificate/:id" element={<CertificateView />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="payment-history" element={<PaymentHistory />} />
            <Route path="payment-success" element={<PaymentSuccess />} />
            <Route path="write-review" element={<WriteReview />} />
            <Route path="teaching-board" element={<TeachingBoard />} />
            <Route path="referrals" element={<Referrals />} />
          </Route>
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="courses" element={<ManageCourses />} />
            <Route path="students" element={<ManageStudents />} />
            <Route path="payments" element={<Payments />} />
            <Route path="notices" element={<Notices />} />
            <Route path="doubts" element={<Doubts />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="live-sessions" element={<ManageLiveSessions />} />
            <Route path="enrollments" element={<ManageEnrollments />} />
            <Route path="submissions" element={<ManageSubmissions />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>
        </Routes>
      </main>
      {!isDashboard && !isCheckout && <Footer />}
      {!isDashboard && <Chatbot />}
      <InstallPrompt />
      {loginModal && <LoginModal onClose={() => setLoginModal(false)} />}
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
