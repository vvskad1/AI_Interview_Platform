import axios from 'axios';

// Use environment variable for API base URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface InviteDetails {
  invite_id: number;
  strict_mode: boolean;
  window_start: string;
  window_end: string;
}

export interface SessionStartResponse {
  session_id: number;
  question: string;
  turn_idx: number;
  answer_seconds: number;
  buffer_seconds: number;
  deadline_utc: string;
}

export interface SpeechSubmissionResponse {
  transcript: string;
  score?: number;
  missing: string[];
  next_question?: string;
  next_turn_idx?: number;
  buffer_seconds: number;
  show_at_utc?: string;
  answer_seconds: number;
  complete: boolean;
}

export interface ProctorEventResponse {
  risk: number;
}

export interface AdminStats {
  candidates: number;
  jobs: number;
  invites: number;
  active_sessions: number;
}

export interface Candidate {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Job {
  id: number;
  title: string;
  level: string;
  department: string;
  jd_text: string;
  created_at: string;
}

export interface CreateInviteResponse {
  invite_id: number;
  interview_url: string;
}

// API functions
export const apiClient = {
  // Invite validation
  async getInviteDetails(token: string): Promise<InviteDetails> {
    const response = await api.get(`/invite/${token}`);
    return response.data;
  },

  // Identity verification
  async sendOTP(email: string, inviteId: number): Promise<void> {
    await api.post('/identity/otp/send', { email, invite_id: inviteId });
  },

  async verifyOTP(email: string, inviteId: number, code: string): Promise<void> {
    await api.post('/identity/otp/verify', { email, invite_id: inviteId, code });
  },

  async verifyLiveness(sessionId?: number, metrics: any = {}): Promise<any> {
    const response = await api.post('/identity/liveness', { session_id: sessionId, metrics });
    return response.data;
  },

  // Session management
  async startSession(inviteId: number): Promise<SessionStartResponse> {
    const response = await api.post('/session/start', {
      invite_id: inviteId,
    });
    return response.data;
  },

  async submitSpeech(sessionId: number, audioBlob: Blob, question: string, turnIdx: number): Promise<SpeechSubmissionResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'answer.webm');
    formData.append('question', question);
    formData.append('turn_idx', turnIdx.toString());

    const response = await api.post(`/session/${sessionId}/speech`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async submitTimeout(sessionId: number, turnIdx: number): Promise<any> {
    const response = await api.post(`/session/${sessionId}/timeout`, { turn_idx: turnIdx });
    return response.data;
  },

  // Proctoring
  async recordProctorEvent(sessionId: number, type: string, present?: boolean, details?: any): Promise<ProctorEventResponse> {
    const response = await api.post(`/proctor/${sessionId}/event`, {
      type,
      present,
      details,
    });
    return response.data;
  },

  // Admin APIs
  async getAdminStats(): Promise<AdminStats> {
    const response = await api.get('/api/admin/stats');
    return response.data;
  },

  async getCandidates(): Promise<any> {
    const response = await api.get('/api/admin/candidates/');
    return response.data;
  },

  async createCandidate(candidateData: any): Promise<any> {
    const response = await api.post('/api/admin/candidates/json', candidateData, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async updateCandidate(id: number, candidateData: any): Promise<any> {
    const response = await api.put(`/api/admin/candidates/${id}`, candidateData, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async deleteCandidate(id: number): Promise<any> {
    const response = await api.delete(`/api/admin/candidates/${id}`);
    return response.data;
  },

  async getJobs(): Promise<any> {
    const response = await api.get('/api/admin/jobs');
    return response.data;
  },

  async createJob(jobData: any): Promise<Job> {
    const response = await api.post('/api/admin/jobs', jobData);
    return response.data;
  },

  async updateJob(id: number, jobData: any): Promise<Job> {
    const response = await api.put(`/api/admin/jobs/${id}`, jobData);
    return response.data;
  },

  async deleteJob(id: number): Promise<void> {
    await api.delete(`/api/admin/jobs/${id}`);
  },

  async createJobWithFile(title: string, level: string, department: string, jdText?: string, jdPdf?: File): Promise<any> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('level', level);
    formData.append('department', department);
    if (jdText) formData.append('jd_text', jdText);
    if (jdPdf) formData.append('jd_pdf', jdPdf);

    const response = await api.post('/api/admin/create-job', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async uploadResume(candidateId: number, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('candidate_id', candidateId.toString());
    formData.append('file', file);

    const response = await api.post('/api/admin/upload-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async createInvite(
    candidateId: number,
    jobId: number,
    strictMode: boolean,
    windowStart: string,
    windowEnd: string
  ): Promise<CreateInviteResponse> {
    const formData = new FormData();
    formData.append('candidate_id', candidateId.toString());
    formData.append('job_id', jobId.toString());
    formData.append('strict_mode', strictMode.toString());
    formData.append('window_start', windowStart);
    formData.append('window_end', windowEnd);

    const response = await api.post('/api/admin/create-invite', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async reinviteCandidate(
    inviteId: number,
    expiresAt?: string
  ): Promise<CreateInviteResponse> {
    const formData = new FormData();
    if (expiresAt) {
      formData.append('expires_at', expiresAt);
    }

    const response = await api.post(`/api/admin/invites/${inviteId}/reinvite`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getSessions(): Promise<any> {
    const response = await api.get('/api/admin/sessions');
    return response.data;
  },

  async getInvites(): Promise<any> {
    const response = await api.get('/api/admin/invites');
    return response.data;
  },

  async createInviteNew(inviteData: any): Promise<any> {
    const response = await api.post('/api/admin/invites', inviteData);
    return response.data;
  },

  async updateInvite(id: number, inviteData: any): Promise<any> {
    const response = await api.put(`/api/admin/invites/${id}`, inviteData);
    return response.data;
  },

  async deleteInvite(id: number): Promise<void> {
    await api.delete(`/api/admin/invites/${id}`);
  },

  async getReports(): Promise<any> {
    const response = await api.get('/api/admin/reports');
    return response.data;
  },

  // Reports
  getReportUrl(sessionId: number): string {
    return `${API_BASE_URL}/reports/${sessionId}.pdf`;
  },
};