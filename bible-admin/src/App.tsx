import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { UsersPage } from '@/pages/UsersPage';
import { ContentPage } from '@/pages/ContentPage';
import { TranslationsPage } from '@/pages/TranslationsPage';
import { DictionaryPage } from '@/pages/DictionaryPage';
import { TopicsPage } from '@/pages/TopicsPage';
import { CommunityPage } from '@/pages/CommunityPage';
import { PrayersPage } from '@/pages/PrayersPage';
import { JournalPage } from '@/pages/JournalPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { MediaPage } from '@/pages/MediaPage';
import { StatisticsPage } from '@/pages/StatisticsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { RolesPage } from '@/pages/RolesPage';
import { AuditLogsPage } from '@/pages/AuditLogsPage';
import { SystemPage } from '@/pages/SystemPage';
import { BackupsPage } from '@/pages/BackupsPage';
import { SecurityPage } from '@/pages/SecurityPage';
import { SettingsPage } from '@/pages/SettingsPage';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/content/:type', element: <ContentPage /> },
          { path: '/translations', element: <TranslationsPage /> },
          { path: '/dictionary', element: <DictionaryPage /> },
          { path: '/topics', element: <TopicsPage /> },
          { path: '/community', element: <CommunityPage /> },
          { path: '/prayers', element: <PrayersPage /> },
          { path: '/journal', element: <JournalPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/media', element: <MediaPage /> },
          { path: '/reading-plans', element: <ContentPage /> },
          { path: '/statistics', element: <StatisticsPage /> },
          { path: '/analytics', element: <AnalyticsPage /> },
          { path: '/roles', element: <RolesPage /> },
          { path: '/audit-logs', element: <AuditLogsPage /> },
          { path: '/system', element: <SystemPage /> },
          { path: '/backups', element: <BackupsPage /> },
          { path: '/security', element: <SecurityPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
