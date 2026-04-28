import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import BubbleBackground from "../components/ui/bubble-background";
import PeerlyLogo from "../../assets/peerly-logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <BubbleBackground showGlow/>
      <div className="text-center bg-white/80 rounded-xl w-full p-10 max-w-md shadow-l">
        <img src={PeerlyLogo} className="w-40 mx-auto pb-4"/>
        <h1 className="mb-4 text-4xl font-bold ">404</h1>
        <p className="mb-4 text-xl text-muted-foreground pb-2">Uy! Por aquí no es</p>

        <a href="/" className="text-primary bg-primary text-white rounded-xl p-1.5 hover:bg-primary/90">
          Volver al inicio
        </a>
      </div>
    </div>
  );
};

export default NotFound;
