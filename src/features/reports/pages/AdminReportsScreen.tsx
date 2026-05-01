import { useState, useEffect } from 'react';
import { reportService, Report, ReportStatus } from '../services/report.service';
import { useCurrentUser } from '@/shared/contexts/CurrentUserContext';
import { ShieldAlert, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const statusLabels: Record<ReportStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En Proceso',
  RESOLVED: 'Resuelto',
  REJECTED: 'Rechazado',
};

const statusConfig: Record<ReportStatus, { bg: string; text: string; icon: React.ElementType }> = {
  PENDING: { 
    bg: 'bg-[hsl(var(--peerly-accent-strong))]/15', 
    text: 'text-[hsl(var(--peerly-accent-strong))]',
    icon: AlertCircle 
  },
  IN_PROGRESS: { 
    bg: 'bg-[hsl(var(--peerly-primary))]/15', 
    text: 'text-[hsl(var(--peerly-primary))]',
    icon: Clock 
  },
  RESOLVED: { 
    bg: 'bg-[hsl(var(--peerly-secondary))]/20', 
    text: 'text-[hsl(var(--peerly-secondary-dark))]',
    icon: CheckCircle 
  },
  REJECTED: { 
    bg: 'bg-[hsl(var(--destructive))]/15', 
    text: 'text-[hsl(var(--destructive))]',
    icon: XCircle 
  },
};

export default function AdminReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [error, setError] = useState<string | null>(null);
  const { userData } = useCurrentUser();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await reportService.getAllReports();
      setReports(data);
    } catch (err) {
      setError('Error al cargar reportes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await reportService.resolveReport(id);
      toast.success('Reporte resuelto correctamente.');
      loadReports();
    } catch (err) {
      toast.error('Error al resolver el reporte. Intenta de nuevo.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await reportService.rejectReport(id);
      toast.success('Reporte rechazado.');
      loadReports();
    } catch (err) {
      toast.error('Error al rechazar el reporte. Intenta de nuevo.');
    }
  };

  const handleInProgress = async (id: string) => {
    try {
      await reportService.markInProgress(id);
      toast.success('Reporte marcado como en proceso.');
      loadReports();
    } catch (err) {
      toast.error('Error al actualizar el reporte. Intenta de nuevo.');
    }
  };

  const filteredReports = filter === 'ALL' 
    ? reports 
    : reports.filter(r => r.status === filter);

  const counts = {
    ALL: reports.length,
    PENDING: reports.filter(r => r.status === 'PENDING').length,
    IN_PROGRESS: reports.filter(r => r.status === 'IN_PROGRESS').length,
    RESOLVED: reports.filter(r => r.status === 'RESOLVED').length,
    REJECTED: reports.filter(r => r.status === 'REJECTED').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--peerly-background))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[hsl(var(--peerly-primary))] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[hsl(var(--peerly-text-secondary))] font-body">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--peerly-background))] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--peerly-primary))] flex items-center justify-center shadow-card">
              <ShieldAlert className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-extrabold text-[hsl(var(--peerly-primary-dark))]">
                Panel de Reportes
              </h1>
              <p className="text-[hsl(var(--peerly-text-secondary))] text-sm">
                Gestiona los reportes de usuarios
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <span className="text-sm text-[hsl(var(--peerly-text-secondary))]">
              Administrador: <span className="font-semibold text-[hsl(var(--peerly-primary-dark))]">{userData?.name}</span>
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-[hsl(var(--destructive))]/10 border border-[hsl(var(--destructive))]/30 text-[hsl(var(--destructive))] px-5 py-4 rounded-2xl mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {(['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'] as const).map((status) => {
              const isActive = filter === status;
              const count = counts[status];
              const labels = { ALL: 'Todos', PENDING: 'Pendientes', IN_PROGRESS: 'En Proceso', RESOLVED: 'Resueltos', REJECTED: 'Rechazados' };
              
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'bg-[hsl(var(--peerly-primary))] text-white shadow-glow' 
                      : 'bg-white text-[hsl(var(--peerly-text-secondary))] hover:bg-[hsl(var(--peerly-primary))]/10 hover:text-[hsl(var(--peerly-primary))] shadow-card'
                  }`}
                >
                  {labels[status]} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-card">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[hsl(var(--peerly-secondary))]/20 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-[hsl(var(--peerly-secondary))]" />
            </div>
            <p className="text-[hsl(var(--peerly-text-secondary))] font-medium">No hay reportes para mostrar</p>
            <p className="text-[hsl(var(--peerly-text-secondary))]/70 text-sm mt-1">Los reportes aparecerán aquí cuando se generen</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredReports.map((report) => {
              const statusConf = statusConfig[report.status as ReportStatus] || statusConfig.PENDING;
              const StatusIcon = statusConf.icon;
              
              return (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl shadow-card border border-[hsl(var(--border))] p-5 md:p-6 hover:shadow-elevated transition-shadow duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConf.bg} ${statusConf.text}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusLabels[report.status as ReportStatus] || report.status}
                        </span>
                        <span className="text-xs text-[hsl(var(--peerly-text-secondary))]">
                          {new Date(report.createdAt).toLocaleDateString('es-CO', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-display font-bold text-[hsl(var(--peerly-primary-dark))] mb-2">
                        {report.title}
                      </h3>
                      <p className="text-sm text-[hsl(var(--peerly-text-secondary))] mb-4 leading-relaxed">
                        {report.content}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[hsl(var(--peerly-background))] text-[hsl(var(--peerly-text-secondary))]">
                          Motivo: {report.reason.replace(/_/g, ' ')}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[hsl(var(--peerly-background))] text-[hsl(var(--peerly-text-secondary))]">
                          Tipo: {report.type}
                        </span>
                      </div>

                      {report.idInvolvedUser && (
                        <div className="mt-4 p-4 bg-[hsl(var(--peerly-background))] rounded-xl">
                          <p className="text-xs font-mono uppercase tracking-wider text-[hsl(var(--peerly-text-secondary))] mb-2">Usuario reportado</p>
                          <div className="flex items-center gap-3">
                            {report.involvedUserProfilePic ? (
                              <img 
                                src={report.involvedUserProfilePic} 
                                alt={report.involvedUserUsername || ''}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-[hsl(var(--peerly-secondary))]/30"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[hsl(var(--peerly-primary))]/15 flex items-center justify-center">
                                <span className="text-[hsl(var(--peerly-primary))] font-bold text-sm">
                                  {report.involvedUserUsername?.[0]?.toUpperCase() || '?'}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-[hsl(var(--peerly-primary-dark))]">
                                {report.involvedUserName || 'Usuario'}
                              </p>
                              <p className="text-xs text-[hsl(var(--peerly-text-secondary))]">
                                @{report.involvedUserUsername}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 shrink-0">
                      {report.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleInProgress(report.id)}
                            className="px-4 py-2 text-sm font-semibold rounded-xl bg-[hsl(var(--peerly-primary))]/15 text-[hsl(var(--peerly-primary))] hover:bg-[hsl(var(--peerly-primary))]/25 transition-colors flex items-center gap-2"
                          >
                            <Clock className="w-4 h-4" />
                            En Proceso
                          </button>
                          <button
                            onClick={() => handleResolve(report.id)}
                            className="px-4 py-2 text-sm font-semibold rounded-xl bg-[hsl(var(--peerly-secondary))]/20 text-[hsl(var(--peerly-secondary))] hover:bg-[hsl(var(--peerly-secondary))]/30 transition-colors flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Resolver
                          </button>
                          <button
                            onClick={() => handleReject(report.id)}
                            className="px-4 py-2 text-sm font-semibold rounded-xl bg-[hsl(var(--destructive))]/15 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/25 transition-colors flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Rechazar
                          </button>
                        </>
                      )}
                      {report.status === 'IN_PROGRESS' && (
                        <>
                          <button
                            onClick={() => handleResolve(report.id)}
                            className="px-4 py-2 text-sm font-semibold rounded-xl bg-[hsl(var(--peerly-secondary))]/20 text-[hsl(var(--peerly-secondary))] hover:bg-[hsl(var(--peerly-secondary))]/30 transition-colors flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Resolver
                          </button>
                          <button
                            onClick={() => handleReject(report.id)}
                            className="px-4 py-2 text-sm font-semibold rounded-xl bg-[hsl(var(--destructive))]/15 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/25 transition-colors flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Rechazar
                          </button>
                        </>
                      )}
                      {report.status === 'RESOLVED' && (
                        <span className="px-4 py-2 text-sm font-semibold rounded-xl bg-[hsl(var(--peerly-secondary))]/20 text-[hsl(var(--peerly-secondary))] flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Resuelto
                        </span>
                      )}
                      {report.status === 'REJECTED' && (
                        <span className="px-4 py-2 text-sm font-semibold rounded-xl bg-[hsl(var(--destructive))]/15 text-[hsl(var(--destructive))] flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          Rechazado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}