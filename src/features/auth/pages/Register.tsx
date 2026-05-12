import { useState, useEffect, useRef } from "react";
import { User, Mail, Lock, BookOpen, Heart, Clock, Plus, Trash2, Loader2, ChevronLeft, Eye, EyeOff, Camera, X, CalendarDays, AlignLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { PeerlyChip } from "@/shared/components/PeerlyChip";
import { DAY_LABELS, TIME_OPTIONS } from "@/shared/data/mockData";
import type { AvailabilityBlock } from "@/shared/data/mockData";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/features/auth/services/auth.service";
import { userApi } from "@/shared/lib/api";
import { interestService, type BackendInterest } from "@/features/users/services/interest.service";
import { toast } from "sonner";
import BubbleBackground from "@/shared/components/ui/bubble-background";
import { motion, useReducedMotion } from "framer-motion";

const careers = [
  { label: "Ingeniería de Sistemas", value: "SYSTEMS_ENGINEERING" },
  { label: "Ingeniería Industrial", value: "INDUSTRIAL_ENGINEERING" },
  { label: "Ingeniería Civil", value: "CIVIL_ENGINEERING" },
  { label: "Ingeniería Mecánica", value: "MECHANICAL_ENGINEERING" },
  { label: "Ingeniería Eléctrica", value: "ELECTRICAL_ENGINEERING" },
  { label: "Ingeniería en Inteligencia Artificial", value: "AI_ENGINEERING" },
  { label: "Administración de Empresas", value: "ENTERPRISE_ADMINISTRATION" },
  { label: "Economía", value: "ECONOMY" },
  { label: "Matemáticas", value: "MATHEMATICS" },
];

const getPasswordStrength = (pwd: string): { level: number; label: string; colorClass: string } => {
  if (!pwd) return { level: 0, label: "", colorClass: "" };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const level = Math.min(4, score);
  const configs = [
    { label: "", colorClass: "" },
    { label: "Muy débil", colorClass: "bg-destructive" },
    { label: "Débil", colorClass: "bg-orange-400" },
    { label: "Media", colorClass: "bg-yellow-400" },
    { label: "Fuerte", colorClass: "bg-[hsl(var(--peerly-secondary))]" },
  ];
  return { level, ...configs[level] };
};

const semesters = Array.from({ length: 10 }, (_, i) => `${i + 1}`);

const isInstitutionalEmail = (email: string) => {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@") || trimmed.endsWith("@")) return false;
  return trimmed.endsWith(".edu") || trimmed.includes(".edu.");
};

const generateBlockId = () => `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const DAY_MAPPING: Record<string, string> = {
  'Lun': 'MONDAY',
  'Mar': 'TUESDAY',
  'Mié': 'WEDNESDAY',
  'Jue': 'THURSDAY',
  'Vie': 'FRIDAY',
  'Sáb': 'SATURDAY',
  'Dom': 'SUNDAY',
};

const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [description, setDescription] = useState("");
  const [profilePicURL, setProfilePicURL] = useState("");
  const [profilePicError, setProfilePicError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePicURL(reader.result as string);
      setProfilePicError(false);
    };
    reader.readAsDataURL(file);
  };
  const [career, setCareer] = useState("");
  const [semester, setSemester] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [availableInterests, setAvailableInterests] = useState<BackendInterest[]>([]);
  const [isLoadingInterests, setIsLoadingInterests] = useState(true);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([
    { id: generateBlockId(), day: DAY_LABELS[0], start: "08:00", end: "10:00" },
  ]);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    interestService.getAllInterests().then(interests => {
      setAvailableInterests(interests);
      setIsLoadingInterests(false);
    });
  }, []);

  const emailIsValid = email.length === 0 || isInstitutionalEmail(email);
  const hasValidInterests = selectedInterests.length >= 3 && selectedInterests.length <= 5;
  const hasAtLeastOneBlock = availabilityBlocks.length > 0;
  const hasProfilePic = profilePicURL.trim().length > 0 && !profilePicError;
  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    isInstitutionalEmail(email) &&
    password.length >= 6 &&
    password === confirmPassword &&
    confirmPassword.length > 0 &&
    birthDate.length > 0 &&
    career &&
    semester &&
    hasValidInterests &&
    hasAtLeastOneBlock &&
    acceptedRules &&
    hasProfilePic;

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : prev.length >= 5
          ? prev
          : [...prev, id],
    );
  };

  const addAvailabilityBlock = () => {
    setAvailabilityBlocks((prev) => [
      ...prev,
      { id: generateBlockId(), day: DAY_LABELS[0], start: "08:00", end: "10:00" },
    ]);
  };

  const removeAvailabilityBlock = (id: string) => {
    setAvailabilityBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const updateAvailabilityBlock = (id: string, field: keyof AvailabilityBlock, value: string) => {
    setAvailabilityBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    try {
      const username = email.split('@')[0];
      const freeTimeSchedule = availabilityBlocks.map(b => ({
        dayOfTheWeek: DAY_MAPPING[b.day] || 'MONDAY',
        startsAt: new Date(`1970-01-01T${b.start}:00Z`),
        endsAt: new Date(`1970-01-01T${b.end}:00Z`),
      }));

      await authService.register({ name: `${firstName} ${lastName}`, email, password });

      const userResponse = await userApi.request<{ id: string }>('users', {
        method: 'POST',
        body: {
          username,
          name: firstName,
          lastname: lastName,
          email,
          birthDate: new Date(birthDate),
          semester: parseInt(semester),
          status: 'ACTIVE',
          programs: [career],
          role: 'USER',
          description: description.trim(),
          freeTimeSchedule,
        },
      });

      localStorage.setItem('user_id', userResponse.id);
      localStorage.setItem('user_name', firstName);
      localStorage.setItem('user_email', email);

      try {
        await userApi.request(`users/${userResponse.id}`, {
          method: 'PUT',
          body: {
            id: userResponse.id,
            username,
            name: firstName,
            lastname: lastName,
            email,
            birthDate: new Date(birthDate),
            semester: parseInt(semester),
            freeTimeSchedule,
            status: 'ACTIVE',
            programs: [career],
            role: 'USER',
            description: '',
            profilePicURL: profilePicURL.trim() || undefined,
            interests: selectedInterests.map(id => ({ id })),
          },
        });
      } catch (interestError) {
        console.warn("[Register] Could not assign interests:", interestError);
      }

      toast.success("¡Cuenta creada! Por favor inicia sesión.");
      navigate("/");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al crear cuenta";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const reduceMotion = useReducedMotion();

  const fadeInRight = {
    hidden: { opacity: 0, x: 18, scale: 0.98 },
    show: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--peerly-background))] flex items-stretch justify-center px-4 py-8">
      <BubbleBackground showGlow />
      <a href="/login" className="group hover:text-[hsl(var(--peerly-primary))] p-8 flex z-20 absolute top-0 left-0 transition delay-150 duration-300 ease-in-out">
        <ChevronLeft className="transition duration-300 ease-in-out group-hover:-translate-x-1" />
        Volver
      </a>
      <div className="w-full max-w-3xl flex flex-col justify-center pt-12 px-4">
        <motion.div
          variants={fadeInRight}
          initial={reduceMotion ? "show" : "hidden"}
          animate="show"
        >
          <Card className="rounded-3xl border-border/60 bg-white/95 shadow-card backdrop-blur">
            <CardHeader className="space-y-2 pb-2">
              <CardTitle className="font-display text-2xl text-[color:hsl(var(--peerly-primary-dark))]">
                Crear cuenta Peerly
              </CardTitle>
              <CardDescription className="text-sm">
                Diseña tu perfil universitario para encontrar personas compatibles por intereses, carrera y horarios.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-8">

                {/* Datos básicos */}
                <section className="space-y-3">
                  <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-[color:hsl(var(--peerly-text-secondary))] flex items-center gap-2">
                    <User className="w-4 h-4 text-[color:hsl(var(--peerly-primary))]" />
                    Datos básicos
                  </h3>

                  {/* Foto de perfil — obligatoria */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-accent/40 border border-border">
                    {/* Avatar clickeable */}
                    <div className="flex-shrink-0">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        aria-label="Seleccionar foto de perfil"
                      />
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-20 h-20 rounded-full overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--peerly-primary))] focus-visible:ring-offset-2"
                        aria-label="Elegir foto de perfil desde tus archivos"
                      >
                        {profilePicURL && !profilePicError ? (
                          <img
                            src={profilePicURL}
                            alt="Preview foto de perfil"
                            className="w-full h-full object-cover"
                            onError={() => setProfilePicError(true)}
                          />
                        ) : (
                          <div className="w-full h-full bg-background border-2 border-dashed border-[hsl(var(--peerly-primary))] flex flex-col items-center justify-center gap-1 text-[hsl(var(--peerly-primary))]">
                            <Camera className="w-6 h-6" />
                            <span className="text-[9px] font-mono font-bold uppercase leading-none">Foto</span>
                          </div>
                        )}
                        {/* Overlay al hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      </motion.button>
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      <label className="text-xs font-medium text-[color:hsl(var(--peerly-text-secondary))] flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[hsl(var(--peerly-primary))]" />
                        Foto de perfil
                        <span className="text-destructive ml-0.5" aria-hidden="true">*</span>
                      </label>

                      {/* Botón primario: elegir archivo */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 h-10 rounded-2xl border-2 border-[hsl(var(--peerly-primary))]/40 bg-[hsl(var(--peerly-primary))]/5 text-[hsl(var(--peerly-primary))] text-sm font-medium hover:bg-[hsl(var(--peerly-primary))]/10 hover:border-[hsl(var(--peerly-primary))]/70 transition-colors flex items-center justify-center gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          {profilePicURL ? "Cambiar foto" : "Elegir desde mis archivos"}
                        </button>
                        {profilePicURL && (
                          <button
                            type="button"
                            onClick={() => { setProfilePicURL(""); setProfilePicError(false); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                            className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label="Quitar foto"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <p id="pic-hint" className={`text-[11px] ${profilePicError ? "text-destructive" : "text-[color:hsl(var(--peerly-text-secondary))]"}`}>
                        {profilePicError
                          ? "No se pudo cargar la imagen. Intenta con otro archivo."
                          : profilePicURL
                            ? "Foto cargada desde tu dispositivo."
                            : "Necesaria para que tus compañeros te reconozcan."}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[color:hsl(var(--peerly-text-secondary))]">
                        Nombre
                      </label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Tu nombre"
                        className="h-11 rounded-2xl bg-background/80 border-border text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[color:hsl(var(--peerly-text-secondary))]">
                        Apellido
                      </label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Tu apellido"
                        className="h-11 rounded-2xl bg-background/80 border-border text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[color:hsl(var(--peerly-text-secondary))] flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        Correo institucional
                      </label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu.correo@universidad.edu"
                        className={`h-11 rounded-2xl bg-background/80 border-border text-sm ${email && !emailIsValid ? "border-destructive" : ""}`}
                      />
                      {email && !emailIsValid && (
                        <p className="text-[11px] text-destructive">
                          Usa tu correo institucional (debe ser de dominio universitario .edu).
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[color:hsl(var(--peerly-text-secondary))] flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                        Fecha de nacimiento
                      </label>
                      <Input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split("T")[0]}
                        max={new Date().toISOString().split("T")[0]}
                        className="h-11 rounded-2xl bg-background/80 border-border text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[color:hsl(var(--peerly-text-secondary))] flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                        Contraseña
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="h-11 rounded-2xl bg-background/80 border-border text-sm pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {password && (
                        <div className="space-y-1 p-1.5">
                          <div className="flex gap-1" role="meter" aria-label={`Fortaleza: ${passwordStrength.label}`}>
                            {[1, 2, 3, 4].map((bar) => (
                              <div
                                key={bar}
                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${passwordStrength.level >= bar ? passwordStrength.colorClass : "bg-border"}`}
                              />
                            ))}
                          </div>
                          <p className="text-[11px] text-muted-foreground">{passwordStrength.label}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[color:hsl(var(--peerly-text-secondary))] flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                        Confirmar contraseña
                      </label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repite tu contraseña"
                          className={`h-11 rounded-2xl bg-background/80 border-border text-sm pr-10 ${
                            confirmPassword && !passwordsMatch ? "border-destructive" : ""
                          } ${confirmPassword && passwordsMatch ? "border-[hsl(var(--peerly-secondary))]" : ""}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPassword && !passwordsMatch && (
                        <p className="text-[11px] text-destructive">Las contraseñas no coinciden.</p>
                      )}
                      {confirmPassword && passwordsMatch && (
                        <p className="text-[11px] text-[hsl(var(--peerly-secondary-dark))]">Las contraseñas coinciden.</p>
                      )}
                    </div>
                  </div>

                  {/* Descripción / bio */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[color:hsl(var(--peerly-text-secondary))] flex items-center gap-1.5">
                      <AlignLeft className="w-3.5 h-3.5 text-muted-foreground" />
                      Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      maxLength={300}
                      placeholder="Cuéntales a tus compañeros quién eres o qué buscas. Ej: Dev en progreso, busco partners para hackathons."
                      className="w-full px-4 py-3 rounded-2xl bg-background/80 border border-border text-sm outline-none focus:border-[hsl(var(--peerly-primary))] focus:ring-2 focus:ring-[hsl(var(--peerly-primary))]/20 transition-colors resize-none text-foreground placeholder:text-muted-foreground"
                    />
                    <p className="text-[11px] text-muted-foreground text-right">{description.length}/300</p>
                  </div>
                </section>

                {/* Perfil académico */}
                <section className="space-y-3">
                  <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-[color:hsl(var(--peerly-text-secondary))] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[color:hsl(var(--peerly-primary))]" />
                    Perfil académico
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[color:hsl(var(--peerly-text-secondary))]">
                        Carrera / Programa
                      </label>
                      <Select value={career} onValueChange={setCareer}>
                        <SelectTrigger className="h-11 rounded-2xl bg-background/80 border-border text-sm">
                          <SelectValue placeholder="Selecciona tu programa" />
                        </SelectTrigger>
                        <SelectContent>
                          {careers.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[color:hsl(var(--peerly-text-secondary))]">
                        Semestre actual
                      </label>
                      <Select value={semester} onValueChange={setSemester}>
                        <SelectTrigger className="h-11 rounded-2xl bg-background/80 border-border text-sm">
                          <SelectValue placeholder="Semestre" />
                        </SelectTrigger>
                        <SelectContent>
                          {semesters.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}° semestre
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                {/* Intereses */}
                <section className="space-y-3">
                  <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-[color:hsl(var(--peerly-text-secondary))] flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[color:hsl(var(--peerly-primary))]" />
                    Intereses comunes
                  </h3>
                  <p className="text-[12px] text-[color:hsl(var(--peerly-text-secondary))]">
                    Selecciona entre 3 y 5 intereses para mejorar tus conexiones. Siempre podrás cambiarlos luego.
                  </p>
                  {isLoadingInterests ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando intereses...
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {availableInterests.map((interest) => (
                        <PeerlyChip
                          key={interest.id}
                          label={interest.name}
                          active={selectedInterests.includes(interest.id)}
                          onClick={() => toggleInterest(interest.id)}
                        />
                      ))}
                    </div>
                  )}
                  <p className={`text-[11px] font-mono transition-colors ${hasValidInterests ? "text-[hsl(var(--peerly-secondary-dark))]" : "text-[color:hsl(var(--peerly-text-secondary))]"}`}>
                    {selectedInterests.length}/5 máximo (mínimo 3)
                  </p>
                </section>

                {/* Disponibilidad */}
                <section className="space-y-3">
                  <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-[color:hsl(var(--peerly-text-secondary))] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[color:hsl(var(--peerly-primary))]" />
                    Franjas disponibles
                  </h3>
                  <p className="text-[12px] text-[color:hsl(var(--peerly-text-secondary))]">
                    Añade bloques de tiempo en los que sueles estar libre (sin clase o para estudiar). Ej: Lun 08:00–10:00.
                  </p>
                  <div className="space-y-2">
                    {availabilityBlocks.map((block) => (
                      <div
                        key={block.id}
                        className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-background/80 px-3 py-2"
                      >
                        <Select
                          value={block.day}
                          onValueChange={(val) => updateAvailabilityBlock(block.id!, "day", val)}
                        >
                          <SelectTrigger className="flex-1 min-w-[4.5rem] h-9 rounded-xl bg-background border-border text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAY_LABELS.map((d) => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-[11px] text-[color:hsl(var(--peerly-text-secondary))]">de</span>
                        <Select
                          value={block.start}
                          onValueChange={(val) => updateAvailabilityBlock(block.id!, "start", val)}
                        >
                          <SelectTrigger className="flex-1 min-w-[5rem] h-9 rounded-xl bg-background border-border text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-52">
                            {TIME_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-[11px] text-[color:hsl(var(--peerly-text-secondary))]">a</span>
                        <Select
                          value={block.end}
                          onValueChange={(val) => updateAvailabilityBlock(block.id!, "end", val)}
                        >
                          <SelectTrigger className="flex-1 min-w-[5rem] h-9 rounded-xl bg-background border-border text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-52">
                            {TIME_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          type="button"
                          onClick={() => removeAvailabilityBlock(block.id!)}
                          className="p-2 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Quitar franja"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addAvailabilityBlock}
                    className="w-full py-2.5 rounded-2xl border-2 border-dashed border-border text-sm font-medium text-[color:hsl(var(--peerly-text-secondary))] hover:border-[hsl(var(--peerly-primary))] hover:text-[hsl(var(--peerly-primary))] transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Añadir franja
                  </button>
                  {!hasAtLeastOneBlock && (
                    <p className="text-[11px] text-destructive">Añade al menos una franja disponible.</p>
                  )}
                </section>

                {/* Comunidad y legal */}
                <section className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="rules"
                      checked={acceptedRules}
                      onCheckedChange={(checked) => setAcceptedRules(checked === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="rules" className="text-[12px] leading-relaxed text-[color:hsl(var(--peerly-text-secondary))]">
                      Acepto las{" "}
                      <span className="font-semibold text-[hsl(var(--peerly-primary))]">
                        Reglas de la Comunidad
                      </span>
                      : respeto mutuo, cero tolerancia al acoso, discursos de odio o discriminación.
                    </label>
                  </div>
                  <p className="text-[11px] text-[color:hsl(var(--peerly-text-secondary))]">
                    Peerly es una aplicación creada por y para estudiantes. No representa oficialmente a
                    ninguna institución universitaria ni actúa en su nombre. Úsala de forma responsable
                    y acorde a las políticas de tu campus.
                  </p>
                </section>

                <div className="space-y-3 pt-2">
                  <Button
                    type="submit"
                    disabled={!canSubmit || isLoading}
                    className={`w-full h-11 rounded-2xl font-display font-semibold text-sm shadow-glow ${canSubmit && !isLoading
                      ? "bg-[hsl(var(--peerly-primary))] hover:bg-[hsl(var(--peerly-primary))]/90 text-white"
                      : "bg-border text-muted-foreground cursor-not-allowed shadow-none"
                      }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creando cuenta...
                      </span>
                    ) : "Crear cuenta"}
                  </Button>
                  {!canSubmit && !isLoading && (firstName || lastName || email || password) && (
                    <p className="text-[11px] text-center text-muted-foreground">
                      Completa todos los campos requeridos: foto de perfil, datos básicos, carrera, intereses (mín. 3) y al menos una franja horaria.
                    </p>
                  )}
                  <p className="text-[12px] text-center text-[color:hsl(var(--peerly-text-secondary))]">
                    ¿Ya tienes cuenta?{" "}
                    <Link
                      to="/login"
                      className="font-semibold text-[hsl(var(--peerly-primary))] hover:underline underline-offset-4"
                    >
                      Inicia sesión
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
