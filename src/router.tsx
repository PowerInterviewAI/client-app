import { createHashRouter } from 'react-router-dom';

import AuthLayout from './pages/auth/layout';
import LoginPage from './pages/auth/login';
import SignupPage from './pages/auth/signup';
import IndexPage from './pages/index';
import MainPage from './pages/main/index';
import PaymentPage from './pages/payment';

export const router = createHashRouter([
  {
    path: '/',
    element: <IndexPage />,
  },
  {
    path: '/main',
    element: <MainPage />,
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
    ],
  },
  {
    path: '/payment',
    element: <PaymentPage />,
  },
]);
