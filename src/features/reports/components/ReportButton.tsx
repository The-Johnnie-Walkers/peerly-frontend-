import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Flag, Loader2, Zap, AlertOctagon, EyeOff, UserX, ShieldOff, FileX, MoreHorizontal,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetTrigger,
} from '@/shared/components/ui/sheet';
import { REPORT_REASON, REPORT_TYPE } from '@/shared/lib/api';
import { reportService, REPORT_REASON_LABELS, CreateReportRequest } from '../services/report.service';
import { useCurrentUser } from '@/shared/contexts/CurrentUserContext';
import { SafeRemoteImage } from '@/shared/components/SafeRemoteImage';
import { toast } from 'sonner';

interface ReportButtonProps {
  userId: string;
  userName: string;
  userPhoto?: string;
  userUsername?: string;
  reportType?: string;
  children?: React.ReactNode;
}

const REASON_ICONS: Record<string, React.ElementType> = {
  SPAM: Zap,
  COMPORTAMIENTO_INAPROPIADO: AlertOctagon,
  CONTENIDO_OFENSIVO: EyeOff,
  ACOSO: UserX,
  FRAUD: ShieldOff,
  INFORMACION_FALSA: FileX,
  OTRO: MoreHorizontal,
};

export const ReportButton: React.FC<ReportButtonProps> = ({
  userId,
  userName,
  userPhoto,
  reportType = REPORT_TYPE.USER,
  children,
}) => {
  const { userData } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = Object.entries(REPORT_REASON);

  const handleSubmit = async () => {
    if (!selectedReason || !userData?.id) {
      toast.error('Selecciona una razón para el reporte');
      return;
    }
    setIsSubmitting(true);
    try {
      const report: CreateReportRequest = {
        title: `Reporte contra ${userName}`,
        content: additionalInfo || `El usuario ${userName} ha sido reportado por: ${REPORT_REASON_LABELS[selectedReason]}`,
        authorId: userData.id,
        reason: selectedReason,
        type: reportType,
        idInvolvedUser: userId,
      };
      await reportService.createReport(report);
      toast.success('Reporte enviado. Gracias por mantener la comunidad segura.');
      setIsOpen(false);
      setSelectedReason('');
      setAdditionalInfo('');
    } catch {
      toast.error('Error al enviar el reporte. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedReason('');
      setAdditionalInfo('');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {children || (
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
            aria-label="Reportar usuario"
          >
            <Flag size={18} />
          </motion.button>
        )}
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-0 border-0 max-h-[92dvh] flex flex-col focus-visible:outline-none"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header con franja roja + info del usuario */}
        <div className="shrink-0 px-6 pt-2 pb-5 border-b border-border/60">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <SafeRemoteImage
                src={userPhoto}
                alt={userName}
                fallback="pastel-icon"
                className="w-14 h-14 rounded-2xl object-cover"
              />
              <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-destructive flex items-center justify-center ring-2 ring-background">
                <Flag size={11} className="text-white" />
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-lg text-foreground leading-tight truncate">
                Reportar a {userName}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Tu reporte es anónimo y confidencial.
              </p>
            </div>
          </div>
        </div>

        {/* Cuerpo scrolleable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Razones */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">¿Por qué lo reportas?</p>
            <div className="grid grid-cols-2 gap-2.5">
              {reasons.map(([key]) => {
                const Icon = REASON_ICONS[key] ?? MoreHorizontal;
                const isSelected = selectedReason === key;
                return (
                  <motion.button
                    key={key}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedReason(key)}
                    className={`flex flex-col items-start gap-2 p-3.5 rounded-2xl border-2 text-left transition-all duration-150 ${
                      isSelected
                        ? 'bg-destructive/10 border-destructive text-destructive'
                        : 'bg-muted/50 border-transparent hover:border-border text-foreground'
                    }`}
                  >
                    <Icon size={18} strokeWidth={1.75} />
                    <span className="text-xs font-medium leading-snug">
                      {REPORT_REASON_LABELS[key]}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Info adicional */}
          <div className="space-y-2">
            <label htmlFor="additional-info" className="text-sm font-semibold text-foreground">
              Información adicional
              <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>
            </label>
            <textarea
              id="additional-info"
              value={additionalInfo}
              onChange={e => setAdditionalInfo(e.target.value)}
              placeholder="Describe brevemente lo que ocurrió..."
              rows={3}
              className="w-full rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
        </div>

        {/* Footer con botones */}
        <div className="shrink-0 px-6 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] border-t border-border/60 space-y-2.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            className="w-full h-12 rounded-2xl bg-destructive text-white font-display font-semibold text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enviando reporte...
              </>
            ) : (
              <>
                <Flag size={16} />
                Enviar reporte
              </>
            )}
          </motion.button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full h-11 rounded-2xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
