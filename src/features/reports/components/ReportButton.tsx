import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flag, Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { REPORT_REASON, REPORT_TYPE } from '@/shared/lib/api';
import { reportService, REPORT_REASON_LABELS, CreateReportRequest } from '../services/report.service';
import { useCurrentUser } from '@/shared/contexts/CurrentUserContext';
import { toast } from 'sonner';

interface ReportButtonProps {
  userId: string;
  userName: string;
  userPhoto?: string;
  userUsername?: string;
  reportType?: string;
  children?: React.ReactNode;
}

export const ReportButton: React.FC<ReportButtonProps> = ({
  userId,
  userName,
  userPhoto,
  userUsername,
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
    } catch (error) {
      console.error('Error submitting report:', error);
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
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Reportar usuario"
          >
            <Flag size={18} />
          </motion.button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Reportar usuario
          </DialogTitle>
          <DialogDescription>
            ¿Por qué deseas reportar a {userName}? Tu reporte es anónimo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-2">
            {reasons.map(([key, label]) => (
              <button
                type="button"
                key={key}
                onClick={() => {
                  console.log('Selected reason:', key);
                  setSelectedReason(key);
                }}
                className={`p-3 rounded-xl text-left transition-all ${
                  selectedReason === key
                    ? 'bg-destructive/20 border-2 border-destructive text-destructive font-medium'
                    : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-2">
            <label htmlFor="additional-info" className="text-sm font-medium">
              Información adicional (opcional)
            </label>
            <textarea
              id="additional-info"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="describe lo que ocurrió..."
              className="min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Reportar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};