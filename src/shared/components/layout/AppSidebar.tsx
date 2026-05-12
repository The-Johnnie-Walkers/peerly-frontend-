import { House, LogOut, MessageCircle, Orbit, PlusSquare, UserPlus, Users2, ShieldAlert, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PeerlyLogo from "@/assets/peerly-logo.png";
import { authService } from "@/features/auth/services/auth.service";
import { NavLink } from "@/shared/components/NavLink";
import { cn } from "@/shared/lib/utils";
import { useCurrentUser } from "@/shared/contexts/CurrentUserContext";
import { SafeRemoteImage } from "@/shared/components/SafeRemoteImage";

const primaryLinks = [
  { to: "/home", label: "Inicio", icon: House },
  { to: "/connect", label: "Descubrir", icon: UserPlus },
  { to: "/explore", label: "Actividades", icon: PlusSquare },
  { to: "/social", label: "Red", icon: Users2 },
  { to: "/communities", label: "Comunidades", icon: Globe },
  { to: "/chats", label: "Chats", icon: MessageCircle },
  { to: "/virtual-world", label: "Mundo virtual", icon: Orbit },
];

const linkBase =
  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-150";

const linkActive = "bg-primary text-white hover:bg-primary hover:text-white shadow-sm";

export const AppSidebar = () => {
  const navigate = useNavigate();
  const { userData } = useCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <aside className="sticky top-0 hidden h-screen md:flex md:w-[240px] lg:w-[260px] shrink-0 flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border shrink-0">
        <img src={PeerlyLogo} alt="Peerly" className="h-9 w-11 object-contain" />
        <span className="font-display text-xl font-bold text-foreground">Peerly</span>
      </div>

      {/* Primary nav */}
      <nav aria-label="Navegación principal" className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {primaryLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={linkBase}
            activeClassName={linkActive}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
        {userData?.role === "ADMIN" && (
          <NavLink
            to="/admin-reports"
            className={cn(linkBase, "text-destructive hover:text-destructive hover:bg-destructive/10")}
            activeClassName="bg-destructive text-white hover:bg-destructive hover:text-white shadow-sm"
          >
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>Reportes</span>
          </NavLink>
        )}
      </nav>

      {/* Bottom: user card + logout */}
      <div className="shrink-0 px-3 pb-5 pt-3 border-t border-border space-y-1">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent transition-colors text-left"
        >
          <div className="relative shrink-0">
            <SafeRemoteImage
              src={userData?.profilePicURL}
              alt={userData?.name ?? 'Perfil'}
              fallback="pastel-icon"
              className="h-9 w-9 rounded-full object-cover border border-border"
            />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-[hsl(var(--peerly-secondary))]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">
              {userData ? `${userData.name} ${userData.lastname}` : 'Mi perfil'}
            </p>
            <p className="text-[11px] text-muted-foreground truncate leading-tight">
              {userData?.programs?.[0] ? `Semestre ${userData.semester}` : 'Ver perfil'}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className={cn(linkBase, "w-full hover:text-destructive hover:bg-destructive/10")}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};
