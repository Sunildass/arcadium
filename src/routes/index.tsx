import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import React, { Suspense } from 'react';
import NotFoundEager from '../pages/NotFound';

// Lazy loading views
const MainMenu = React.lazy(() => import('../pages/MainMenu'));
const GameWrapper = React.lazy(() => import('../pages/GameWrapper'));
const LandingScreen = React.lazy(() => import('../screens/LandingScreen'));
const BootScreen = React.lazy(() => import('../screens/BootScreen'));

// Loading Fallback
const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white">
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-zinc-400 font-mono tracking-wider">Loading Arcadium...</p>
    </div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <NotFoundEager />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <LandingScreen />
          </Suspense>
        ),
      },
      {
        path: 'boot',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <BootScreen />
          </Suspense>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <MainMenu />
          </Suspense>
        ),
      },
      {
        path: 'dashboard/category/:categoryId',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <MainMenu /> {/* Main menu handles filtering internally */}
          </Suspense>
        ),
      },
      {
        path: 'game/:id',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <GameWrapper />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: <NotFoundEager />,
      }
    ],
  },
]);
