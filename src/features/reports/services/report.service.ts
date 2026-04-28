import { reportsApi, REPORTS_API_BASE } from '@/shared/lib/api';

export interface Report {
  id: string;
  title: string;
  content: string;
  authorId: string;
  status: string;
  reason: string;
  type: string;
  createdAt: Date;
  idInvolvedUser: string | null;
  involvedUserName: string | null;
  involvedUserUsername: string | null;
  involvedUserProfilePic: string | null;
  updatedAt: Date;
}

export type ReportStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface CreateReportRequest {
  title: string;
  content: string;
  authorId: string;
  reason: string;
  type: string;
  idInvolvedUser?: string;
}

export const REPORT_REASON_LABELS: Record<string, string> = {
  SPAM: 'Spam',
  COMPORTAMIENTO_INAPROPIADO: 'Comportamiento inapropiado',
  CONTENIDO_OFENSIVO: 'Contenido ofensivo',
  ACOSO: 'Acoso',
  FRAUD: 'Fraude',
  INFORMACION_FALSA: 'Información falsa',
  OTRO: 'Otro',
};

export const reportService = {
  async createReport(report: CreateReportRequest): Promise<Report> {
    return reportsApi.request<Report>(REPORTS_API_BASE, {
      method: 'POST',
      body: report,
    });
  },

  async getAllReports(): Promise<Report[]> {
    return await reportsApi.request<Report[]>(REPORTS_API_BASE);
  },

  async getReportById(id: string): Promise<Report> {
    return await reportsApi.request<Report>(`${REPORTS_API_BASE}/${id}`);
  },

  async updateReportStatus(id: string, status: ReportStatus): Promise<Report> {
    return await reportsApi.request<Report>(`${REPORTS_API_BASE}/${id}/status`, {
      method: 'PUT',
      body: { status },
    });
  },

  async resolveReport(id: string): Promise<Report> {
    return await reportsApi.request<Report>(`${REPORTS_API_BASE}/${id}/resolve`, {
      method: 'PUT',
    });
  },

  async rejectReport(id: string): Promise<Report> {
    return await reportsApi.request<Report>(`${REPORTS_API_BASE}/${id}/reject`, {
      method: 'PUT',
    });
  },

  async markInProgress(id: string): Promise<Report> {
    return await reportsApi.request<Report>(`${REPORTS_API_BASE}/${id}/in-progress`, {
      method: 'PUT',
    });
  },
};