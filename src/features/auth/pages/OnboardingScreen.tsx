import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Mail, Shield } from 'lucide-react';
import { INTERESTS, DAY_LABELS, TIME_LABELS } from '@/shared/data/mockData';
import { PeerlyChip } from '@/shared/components/PeerlyChip';

const OnboardingScreen = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [availability, setAvailability] = useState<number[]>([]);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [name, setName] = useState('');
  const [career, setCareer] = useState('');

  const steps = [
    { title: 'Únete a tu campus', subtitle: 'Verifica tu correo universitario para empezar' },
    { title: 'Cuéntanos de ti', subtitle: 'Tu identidad en el campus' },
    { title: '¿Qué te mueve?', subtitle: 'Selecciona al menos 3 intereses' },
    { title: 'Tu tiempo', subtitle: '¿Cuándo estás libre para parchar?' },
  ];

  const canContinue = () => {
    if (step === 0) return emailVerified;
    if (step === 1) return name.length > 0 && career.length > 0;
    if (step === 2) return selectedInterests.length >= 3;
    return true;
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else navigate('/');
  };

  const toggleAvailability = (slot: number) => {
    setAvailability(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="h-svh flex flex-col bg-background">
      {/* Progress bar */}
      <div className="flex gap-2 p-6 pb-0">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i <= step ? 'bg-primary' : 'bg-border'
            }`}
          />
        ))}
      </div>

      {/* Social proof */}
      <div className="px-6 pt-3">
        <p className="text-[10px] font-mono text-primary font-medium">
          847 estudiantes de tu campus ya están en Peerly
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <h1 className="text-3xl font-display font-extrabold mb-2">{steps[step].title}</h1>
            <p className="text-muted-foreground mb-8">{steps[step].subtitle}</p>

            {step === 0 && (
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-4 pl-12 rounded-2xl bg-card border border-border outline-none focus:border-primary transition-colors font-body"
                    placeholder="tu.correo@universidad.edu"
                  />
                </div>
                {!emailVerified && email.length > 5 && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setEmailVerified(true)}
                    className="w-full p-4 rounded-2xl bg-primary text-primary-foreground font-display font-bold"
                  >
                    Enviar código de verificación
                  </motion.button>
                )}
                {emailVerified && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-success/10 border border-success/20"
                  >
                    <Shield size={20} className="text-success" />
                    <span className="text-sm font-medium text-success">Correo verificado ✓</span>
                  </motion.div>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className="w-28 h-28 bg-accent rounded-3xl mx-auto flex items-center justify-center border-2 border-dashed border-primary cursor-pointer mb-6"
                >
                  <Plus className="text-primary" size={28} />
                </motion.div>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-card border border-border outline-none focus:border-primary transition-colors font-body"
                  placeholder="Nombre completo"
                />
                <input
                  value={career}
                  onChange={e => setCareer(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-card border border-border outline-none focus:border-primary transition-colors font-body"
                  placeholder="Carrera / Facultad"
                />
                <select className="w-full p-4 rounded-2xl bg-card border border-border outline-none focus:border-primary transition-colors font-body text-foreground">
                  <option value="">Semestre</option>
                  {[1,2,3,4,5,6,7,8,9,10].map(s => (
                    <option key={s} value={s}>{s}° Semestre</option>
                  ))}
                </select>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2.5">
                  {INTERESTS.map(item => (
                    <PeerlyChip
                      key={item.id}
                      label={item.label}
                      iconName={item.icon}
                      active={selectedInterests.includes(item.id)}
                      onClick={() => toggleInterest(item.id)}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-4">
                  {selectedInterests.length}/3 mínimo seleccionados
                </p>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="grid grid-cols-6 gap-1.5">
                  <div /> {/* empty corner */}
                  {DAY_LABELS.map(d => (
                    <div key={d} className="text-center text-[10px] font-mono font-bold text-muted-foreground py-2">{d}</div>
                  ))}
                  {TIME_LABELS.map((time, row) => (
                    <>
                      <div key={`label-${row}`} className="text-[10px] font-mono text-muted-foreground flex items-center">{time}</div>
                      {DAY_LABELS.map((_, col) => {
                        const slot = row * 5 + col;
                        const isSelected = availability.includes(slot);
                        return (
                          <motion.button
                            key={slot}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleAvailability(slot)}
                            className={`aspect-square rounded-xl border transition-all ${
                              isSelected
                                ? 'bg-primary border-primary'
                                : 'bg-card border-border hover:border-primary/40'
                            }`}
                          />
                        );
                      })}
                    </>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-4">
                  Toca los horarios en los que estás libre
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Profile completion bar */}
      <div className="px-6 pb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono text-muted-foreground">Perfil completado</span>
          <span className="text-[10px] font-mono font-bold text-primary">{Math.min(25 * (step + 1), 90)}%</span>
        </div>
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${Math.min(25 * (step + 1), 90)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <div className="p-6 pt-3">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleNext}
          disabled={!canContinue()}
          className={`w-full p-4 rounded-2xl font-display font-bold text-lg transition-all ${
            canContinue()
              ? 'bg-primary text-primary-foreground shadow-glow'
              : 'bg-border text-muted-foreground cursor-not-allowed'
          }`}
        >
          {step === 3 ? '¡Empezar! 🎉' : 'Continuar'}
        </motion.button>
      </div>
    </div>
  );
};

export default OnboardingScreen;
