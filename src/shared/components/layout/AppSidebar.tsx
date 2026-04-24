import { Compass, House, LogOut, MessageCircle, Orbit, PlusSquare, User, UserPlus, Users2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PeerlyLogo from "@/assets/peerly-logo.png";
import { authService } from "@/features/auth/services/auth.service";
import { NavLink } from "@/shared/components/NavLink";
import { cn } from "@/shared/lib/utils";

const primaryLinks = [
  { to: "/home", label: "Inicio", icon: House },
  { to: "/connect", label: "Descubrir", icon: UserPlus },
  { to: "/explore", label: "Actividades", icon: PlusSquare },
  { to: "/social", label: "Red", icon: Users2 },
  { to: "/chats", label: "Chats", icon: MessageCircle },
  { to: "/virtual-world", label: "Mundo virtual", icon: Orbit },
];

const secondaryLinks = [{ to: "/profile", label: "Perfil", icon: User }];

const linkBaseClass =
  "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-[color:hsl(var(--peerly-text-secondary))] transition-all duration-200 hover:bg-white hover:text-[color:hsl(var(--peerly-primary-dark))] hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--peerly-primary))]/35";

export const AppSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <aside className="sticky top-0 hidden h-screen md:flex md:w-[248px] lg:w-[272px] shrink-0 flex-col border-r border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,248,242,0.82))] px-4 py-5 backdrop-blur-xl">
      <div className="flex items-center gap-3 rounded-[26px] border border-white/80 bg-white/80 px-3 py-3 shadow-card">
        <img src={PeerlyLogo} alt="Peerly" className="h-11 w-14" />
        <div className="min-w-0">
          <p className="font-display text-xl font-bold text-[color:hsl(var(--peerly-primary-dark))]">Peerly</p>
        </div>
      </div>

      <nav aria-label="Navegacion principal" className="mt-7 flex flex-1 flex-col gap-2">
        {primaryLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={cn(linkBaseClass, "justify-start")}
            activeClassName="bg-white text-[color:hsl(var(--peerly-primary-dark))] shadow-card"
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-3 border-t border-[hsl(var(--border))]/70 pt-3">
        <div className="flex flex-col gap-2">
          {secondaryLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={cn(linkBaseClass, "justify-start")}
              activeClassName="bg-white text-[color:hsl(var(--peerly-primary-dark))] shadow-card"
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}

          <button
            type="button"
            onClick={handleLogout}
            className={cn(linkBaseClass, "justify-start border border-transparent bg-transparent")}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Cerrar sesion</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
