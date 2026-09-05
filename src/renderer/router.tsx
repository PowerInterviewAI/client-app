import { createHashRouter, Outlet } from 'react-router-dom';

import MainFrame from './components/custom/main-frame';
import ForgotPasswordPage from './pages/auth/forgot-password';
import AuthLayout from './pages/auth/layout';
import LoginPage from './pages/auth/login';
import SignupPage from './pages/auth/signup';
import DocumentationPage from './pages/documentation';
import IndexPage from './pages/index';
import MainPage from './pages/main/index';
import MockInterviewPage from './pages/mock-interview/index';
import PaymentPage from './pages/payment';
import SettingsPage from './pages/settings';

// MainFrame is a layout route rather than a wrapper around RouterProvider so that the chrome it
// renders - the titlebar and its menu - sits inside the router and can navigate with useNavigate.
export const router = createHashRouter([
  {
    element: (
      <MainFrame>
        <Outlet />
      </MainFrame>
    ),
    children: [
      {
        path: '/',
        element: <IndexPage />,
      },
      {
        path: '/main',
        element: <MainPage />,
      },
      {
        path: '/mock-interview',
        element: <MockInterviewPage />,
      },
      {
        path: '/auth',
        element: <AuthLayout />,
        children: [
          {
            path: 'login',
            element: <LoginPage />,
          },
          {
            path: 'signup',
            element: <SignupPage />,
          },
          {
            path: 'forgot-password',
            element: <ForgotPasswordPage />,
          },
        ],
      },
      {
        path: '/payment',
        element: <PaymentPage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
      {
        path: '/documentation',
        element: <DocumentationPage />,
      },
    ],
  },
]);
