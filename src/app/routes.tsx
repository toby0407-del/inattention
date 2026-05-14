import { createBrowserRouter, Outlet } from 'react-router';

/** 只做子路由 Outlet，對應 /child/* */
function ChildLayout() {
  return <Outlet />;
}
import { AppProvider } from './context/AppContext';
import { MessagesProvider } from './context/MessagesContext';
import SplashScreen from './pages/SplashScreen';
import ParentLayout from './layouts/ParentLayout';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Messages from './pages/Messages';
import QuestMap from './pages/QuestMap';
import ChildSettings from './pages/ChildSettings';
import Calibration from './pages/Calibration';
import Gameplay from './pages/Gameplay';
import Reward from './pages/Reward';
import Developer from './pages/Developer';
import GazeTest from './pages/GazeTest';

function Root() {
  return (
    <AppProvider>
      <MessagesProvider>
        <Outlet />
      </MessagesProvider>
    </AppProvider>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: SplashScreen },
      {
        path: 'parent',
        Component: ParentLayout,
        children: [
          { index: true, Component: Dashboard },
          { path: 'analytics', Component: Analytics },
          { path: 'settings', Component: Settings },
          { path: 'messages', Component: Messages },
          { path: 'dev', Component: Developer },
          { path: 'gaze-test', Component: GazeTest },
        ],
      },
      {
        path: 'child',
        Component: ChildLayout,
        children: [
          { path: 'lobby', Component: QuestMap },
          { path: 'settings', Component: ChildSettings },
          { path: 'calibration', Component: Calibration },
          { path: 'play', Component: Gameplay },
          { path: 'reward', Component: Reward },
        ],
      },
    ],
  },
]);
