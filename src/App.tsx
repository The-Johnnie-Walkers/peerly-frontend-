import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrentUserProvider } from "@/contexts/CurrentUserContext";
import { BottomNav } from "@/components/peerly/BottomNav";
import SplashScreen from "./pages/SplashScreen";
import OnboardingScreen from "./pages/OnboardingScreen";
import LandingPage from "./pages/LandingPage";
import HomeScreen from "./pages/HomeScreen";
import ConnectScreen from "./pages/ConnectScreen";
import ChatsScreen from "./pages/ChatsScreen";
import ProfileScreen from "./pages/ProfileScreen";
import EditProfileScreen from "./pages/EditProfileScreen";
import ExploreScreen from "./pages/ExploreScreen";
import ActivityDetailScreen from "./pages/ActivityDetailScreen";
import CreateActivityScreen from "./pages/CreateActivityScreen";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = () => {
  const location = useLocation();
  const hideBottomNavOn = ["/", "/forgot-password", "/register", "/splash", "/onboarding"];
  const shouldShowBottomNav = !hideBottomNavOn.includes(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 lg:py-8 relative">
        <div className="min-h-[calc(100vh-2rem)] lg:min-h-[calc(100vh-4rem)]">
          <Routes>
            <Route path="/splash" element={<SplashScreen />} />
            <Route path="/onboarding" element={<OnboardingScreen />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/connect" element={<ConnectScreen />} />
            <Route path="/chats" element={<ChatsScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/profile/edit" element={<EditProfileScreen />} />
            <Route path="/profile/:id" element={<ProfileScreen />} />
            <Route path="/explore" element={<ExploreScreen />} />
            <Route path="/activity/:id" element={<ActivityDetailScreen />} />
            <Route path="/create-activity" element={<CreateActivityScreen />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        {shouldShowBottomNav && <BottomNav />}
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
