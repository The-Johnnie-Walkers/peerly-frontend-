import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { Toaster } from "@/shared/components/ui/toaster";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { BottomNav } from "@/shared/components/layout/BottomNav";
import { AppSidebar } from "@/shared/components/layout/AppSidebar";
import { CurrentUserProvider } from "@/shared/contexts/CurrentUserContext";
import SplashScreen from "./features/auth/pages/SplashScreen";
import OnboardingScreen from "./features/auth/pages/OnboardingScreen";
import Register from "./features/auth/pages/Register";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import ResetPassword from "./features/auth/pages/ResetPassword";
import HomeScreen from "./features/home/pages/HomeScreen";
import ConnectScreen from "./features/connections/pages/ConnectScreen";
import ConnectionsScreen from "./features/connections/pages/ConnectionsScreen";
import ChatsScreen from "./features/messaging/pages/ChatsScreen";
import ProfileScreen from "./features/users/pages/ProfileScreen";
import EditProfileScreen from "./features/users/pages/EditProfileScreen";
import ExploreScreen from "./features/activities/pages/ExploreScreen";
import ActivityDetailScreen from "./features/activities/pages/ActivityDetailScreen";
import CreateActivityScreen from "./features/activities/pages/CreateActivityScreen";
import VirtualWorldScreen from "./features/virtual-world/pages/VirtualWorldScreen";
import NotFound from "./shared/pages/NotFound";
import LandingPage from "./features/landing/pages/LandingPage";
import Login from "./features/auth/pages/Login";

const queryClient = new QueryClient();

const appShellMatchers = [
  "/home",
  "/connect",
  "/social",
  "/chats",
  "/profile",
  "/explore",
  "/activity",
  "/create-activity",
  "/virtual-world",
];

const usesAppShell = (pathname: string) =>
  appShellMatchers.some((path) => pathname === path || pathname.startsWith(`${path}/`));

const AppLayout = () => {
  const location = useLocation();
  const showSidebar = usesAppShell(location.pathname);

  const appRoutes = (
    <Routes>
      <Route path="/splash" element={<SplashScreen />} />
      <Route path="/onboarding" element={<OnboardingScreen />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="login" element={<Login/>}/>
      <Route path="/home" element={<HomeScreen />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/connect" element={<ConnectScreen />} />
      <Route path="/social" element={<ConnectionsScreen />} />
      <Route path="/chats" element={<ChatsScreen />} />
      <Route path="/profile" element={<ProfileScreen />} />
      <Route path="/profile/edit" element={<EditProfileScreen />} />
      <Route path="/profile/:id" element={<ProfileScreen />} />
      <Route path="/explore" element={<ExploreScreen />} />
      <Route path="/activity/:id" element={<ActivityDetailScreen />} />
      <Route path="/create-activity" element={<CreateActivityScreen />} />
      <Route path="/virtual-world" element={<VirtualWorldScreen />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  if (!showSidebar) {
    return <div className="min-h-screen bg-background">{appRoutes}</div>;
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--peerly-background))] md:flex">
      <AppSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="flex-1 pb-24 md:pb-0">{appRoutes}</main>
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CurrentUserProvider>
          <AppLayout />
        </CurrentUserProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
