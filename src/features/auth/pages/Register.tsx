import { useState } from "react";
import { User, Mail, Lock, BookOpen, UserPlus, Clock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { PeerlyChip } from "@/shared/components/PeerlyChip";
import { INTERESTS, DAY_LABELS, TIME_OPTIONS } from "@/shared/data/mockData";
import type { AvailabilityBlock } from "@/shared/data/mockData";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/features/auth/services/auth.service";
import { userApi } from "@/shared/lib/api";
import { toast } from "sonner";

const careers = [
  { label: "Ingeniería de Sistemas", value: "SYSTEMS_ENGINEERING" },
  { label: "Ingeniería Industrial", value: "INDUSTRIAL_ENGINEERING" },
  { label: "Ingeniería Civil", value: "CIVIL_ENGINEERING" },
  { label: "Ingeniería Mecánica", value: "MECHANICAL_ENGINEERING" },
  { label: "Ingeniería Eléctrica", value: "ELECTRICAL_ENGINEERING" },
  { label: "Ingeniería de Sistemas", value: "AI_ENGINEERING" },
  { label: "Administración de Empresas", value: "ENTERPRISE_ADMINISTRATION" },
  { label: "Economía", value: "ECONOMY" },
  { label: "Matemáticas", value: "MATHEMATICS" },
];

const semesters = Array.from({ length: 10 }, (_, i) => `${i + 1}`);

const isInstitutionalEmail = (email: string) => {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@") || trimmed.endsWith("@")) return false;
  return trimmed.endsWith(".edu") || trimmed.includes(".edu.");
};

const generateBlockId = () => `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [career, setCareer] = useState("");
  const [semester, setSemester] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([
    { id: generateBlockId(), day: DAY_LABELS[0], start: "08:00", end: "10:00" },
  ]);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const emailIsValid = email.length === 0 || isInstitutionalEmail(email);
  const hasMinimumInterests = selectedInterests.length >= 3;
  const hasAtLeastOneBlock = availabilityBlocks.length > 0;
  const canSubmit =
    name.trim().length > 0 &&
    isInstitutionalEmail(email) &&
    password.length >= 6 &&
    career &&
    semester &&
    hasMinimumInterests &&
    hasAtLeastOneBlock &&
    acceptedRules;

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const addAvailabilityBlock = () => {
    setAvailabilityBlocks((prev) => [
      ...prev,
      {
        id: generateBlockId(),
        day: DAY_LABELS[0],
        start: "08:00",
        end: "10:00",
      },
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
      const lastname = name.split(' ').slice(1).join(' ') || name;
      
      await authService.register({ name, email, password });

      await userApi.request('users', {
        method: 'POST',
        body: {
          username,
          name,
          lastname,
          email,
          birthDate: new Date('2000-01-01'),
          semester: parseInt(semester),
          interests: selectedInterests.map(id => ({ id, name: id })),
          freeTimeSchedule: availabilityBlocks.map(b => ({
            id: b.id,
            dayOfTheWeek: b.day,
            startsAt: new Date(`1970-01-01T${b.start}:00`),
            endsAt: new Date(`1970-01-01T${b.end}:00`),
          })),
          status: 'ACTIVE',
          programs: [career],
          role: 'USER',
          description: '',
        },
      });

      toast.success("¡Cuenta creada! Por favor inicia sesión.");
      navigate("/");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al crear cuenta";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--peerly-background))] flex items-stretch justify-center px-4 py-8">
      <div className="w-full max-w-3xl flex flex-col justify-center">
        <Card className="rounded-3xl border-border/60 bg-white/95 shadow-card">
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-[color:hsl(var(--peerly-text-secondary))]">
                      Nombre completo
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre como aparece en la universidad"
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
                      className={`h-11 rounded-2xl bg-background/80 border-border text-sm ${
                        email && !emailIsValid ? "border-destructive" : ""
                      }`}
                    />
                    {email && !emailIsValid && (
                      <p className="text-[11px] text-destructive">
                        Usa tu correo institucional (debe ser de dominio universitario .edu).
                      </p>
                    )}
                    {!email && (
                      <p className="text-[11px] text-[color:hsl(var(--peerly-text-secondary))]">
                        Solo aceptamos correos verificados para mantener la comunidad segura.
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[color:hsl(var(--peerly-text-secondary))] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      Contraseña
                    </label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="h-11 rounded-2xl bg-background/80 border-border text-sm"
                    />
                  </div>
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
                  <UserPlus className="w-4 h-4 text-[color:hsl(var(--peerly-primary))]" />
                  Intereses comunes
                </h3>
                <p className="text-[12px] text-[color:hsl(var(--peerly-text-secondary))]">
                  Selecciona al menos 3 intereses para mejorar tus conexiones. Siempre podrás cambiarlos luego.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {INTERESTS.map((interest) => (
                    <PeerlyChip
                      key={interest.id}
                      label={interest.label}
                      iconName={interest.icon}
                      active={selectedInterests.includes(interest.id)}
                      onClick={() => toggleInterest(interest.id)}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-[color:hsl(var(--peerly-text-secondary))] font-mono">
                  {selectedInterests.length}/3 mínimo seleccionados
                </p>
              </section>

              {/* Disponibilidad por franjas (bloques) */}
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
                      <select
                        value={block.day}
                        onChange={(e) => updateAvailabilityBlock(block.id!, "day", e.target.value)}
                        className="flex-1 min-w-[4rem] rounded-xl border border-border bg-background px-3 py-2 text-sm"
                      >
                        {DAY_LABELS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <span className="text-[11px] text-[color:hsl(var(--peerly-text-secondary))]">de</span>
                      <select
                        value={block.start}
                        onChange={(e) => updateAvailabilityBlock(block.id!, "start", e.target.value)}
                        className="flex-1 min-w-[4.5rem] rounded-xl border border-border bg-background px-3 py-2 text-sm"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <span className="text-[11px] text-[color:hsl(var(--peerly-text-secondary))]">a</span>
                      <select
                        value={block.end}
                        onChange={(e) => updateAvailabilityBlock(block.id!, "end", e.target.value)}
                        className="flex-1 min-w-[4.5rem] rounded-xl border border-border bg-background px-3 py-2 text-sm"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
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
                  className={`w-full h-11 rounded-2xl font-display font-semibold text-sm shadow-glow ${
                    canSubmit && !isLoading
                      ? "bg-[hsl(var(--peerly-primary))] hover:bg-[hsl(var(--peerly-primary))]/90 text-white"
                      : "bg-border text-muted-foreground cursor-not-allowed shadow-none"
                  }`}
                >
                  {isLoading ? "Creando cuenta..." : "Crear cuenta"}
                </Button>
                <p className="text-[12px] text-center text-[color:hsl(var(--peerly-text-secondary))]">
                  ¿Ya tienes cuenta?{" "}
                  <Link
                    to="/"
                    className="font-semibold text-[hsl(var(--peerly-primary))] hover:underline underline-offset-4"
                  >
                    Inicia sesión
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;

