import { createBrowserRouter } from "react-router";
import { RoleSelection } from "./screens/RoleSelection";
import { AuthModal } from "./screens/AuthModal";
import { Dashboard } from "./screens/Dashboard";
import { Analytics } from "./screens/Analytics";
import { Settings } from "./screens/Settings";
import { ChildHome } from "./screens/ChildHome";
import { Calibration } from "./screens/Calibration";
import { Gameplay } from "./screens/Gameplay";
import { Reward } from "./screens/Reward";
import { SystemArchitecture } from "./screens/SystemArchitecture";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RoleSelection,
  },
  {
    path: "/auth",
    Component: AuthModal,
  },
  {
    path: "/dashboard",
    Component: Dashboard,
  },
  {
    path: "/analytics",
    Component: Analytics,
  },
  {
    path: "/settings",
    Component: Settings,
  },
  {
    path: "/child",
    Component: ChildHome,
  },
  {
    path: "/calibration",
    Component: Calibration,
  },
  {
    path: "/game",
    Component: Gameplay,
  },
  {
    path: "/reward",
    Component: Reward,
  },
  {
    path: "/architecture",
    Component: SystemArchitecture,
  },
]);
