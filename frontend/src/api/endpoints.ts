// REAL API endpoints based on actual backend at http://localhost:5000/api
// All routes and response structures are verified against live backend

import { httpClient, ApiResult } from './http';
import type {
  LoginRequest,
  AuthResponse,
  RegisterRequest,
  UserDTO,
  VehicleDTO,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  ProductDTO,
  QuoteDTO,
  CreateQuoteRequest,
  PolicyDTO,
  CreatePolicyRequest,
  RenewPolicyRequest,
  CancelPolicyRequest,
  DocumentDTO,
  ClaimDTO,
  CreateClaimRequest,
  ClaimMessageRequest,
  NotificationDTO,
  DashboardData,
  AuditLogDTO,
  AuditLogStatsDTO,
} from '@/types/dto';

// ========================================
// AUTH
// ========================================
export const authApi = {
  register: (data: RegisterRequest): ApiResult<AuthResponse> =>
    httpClient.post('/auth/register', data).then((res) => res.data),

  login: (data: LoginRequest): ApiResult<AuthResponse> =>
    httpClient.post('/auth/login', data).then((res) => res.data),

  getMe: (): ApiResult<UserDTO> =>
    httpClient.get('/auth/me').then((res) => res.data),
};

// ========================================
// VEHICLES
// ========================================
export const vehiclesApi = {
  create: (data: CreateVehicleRequest): ApiResult<VehicleDTO> =>
    httpClient.post('/vehicles', data).then((res) => res.data),

  getAll: (): ApiResult<{ count: number; vehicles: VehicleDTO[] }> =>
    httpClient.get('/vehicles').then((res) => res.data),

  getById: (id: string): ApiResult<VehicleDTO> =>
    httpClient.get(`/vehicles/${id}`).then((res) => res.data),

  update: (id: string, data: UpdateVehicleRequest): ApiResult<VehicleDTO> =>
    httpClient.put(`/vehicles/${id}`, data).then((res) => res.data),

  delete: (id: string): ApiResult<void> =>
    httpClient.delete(`/vehicles/${id}`).then((res) => res.data),
};

// ========================================
// PRODUCTS
// ========================================
export const productsApi = {
  getAll: (): ApiResult<{ count: number; products: ProductDTO[] }> =>
    httpClient.get('/products').then((res) => res.data),

  getById: (id: string): ApiResult<ProductDTO> =>
    httpClient.get(`/products/${id}`).then((res) => res.data),
};

// ========================================
// QUOTES
// ========================================
export const quotesApi = {
  create: (data: CreateQuoteRequest): ApiResult<QuoteDTO> =>
    httpClient.post('/quotes', data).then((res) => res.data),

  getAll: (params?: { status?: string; page?: number; limit?: number }): ApiResult<{ 
    count: number; 
    total: number;
    page: number;
    limit: number;
    quotes: QuoteDTO[] 
  }> =>
    httpClient.get('/quotes', { params }).then((res) => res.data),

  getById: (id: string): ApiResult<QuoteDTO> =>
    httpClient.get(`/quotes/${id}`).then((res) => res.data),

  accept: (id: string): ApiResult<QuoteDTO> =>
    httpClient.post(`/quotes/${id}/accept`).then((res) => res.data),

  reject: (id: string, data: { reason: string }): ApiResult<QuoteDTO> =>
    httpClient.post(`/quotes/${id}/reject`, data).then((res) => res.data),
};

// ========================================
// POLICIES
// ========================================
export const policiesApi = {
  create: (data: CreatePolicyRequest): ApiResult<PolicyDTO> =>
    httpClient.post('/policies', data).then((res) => res.data),

  getAll: (params?: { status?: string; page?: number; limit?: number }): ApiResult<{ 
    count: number;
    total: number;
    page: number;
    limit: number;
    policies: PolicyDTO[] 
  }> =>
    httpClient.get('/policies', { params }).then((res) => res.data),

  getById: (id: string): ApiResult<PolicyDTO> =>
    httpClient.get(`/policies/${id}`).then((res) => res.data),

  getDocuments: (id: string): ApiResult<{ documents: DocumentDTO[] }> =>
    httpClient.get(`/policies/${id}/documents`).then((res) => res.data),

  renew: (id: string, data: RenewPolicyRequest): ApiResult<PolicyDTO> =>
    httpClient.patch(`/policies/${id}/renew`, data).then((res) => res.data),

  cancel: (id: string, data: CancelPolicyRequest): ApiResult<PolicyDTO> =>
    httpClient.patch(`/policies/${id}/cancel`, data).then((res) => res.data),
};

// ========================================
// DOCUMENTS
// ========================================
export const documentsApi = {
  download: (id: string): Promise<Blob> =>
    httpClient.get(`/documents/${id}/download`, { responseType: 'blob' }).then((res) => res.data),
};

/**
 * Utility to download a document as a file in the browser
 */
export const downloadDocument = async (docId: string, filename?: string): Promise<void> => {
  try {
    const blob = await documentsApi.download(docId);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `document_${docId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

// ========================================
// CLAIMS
// ========================================
export const claimsApi = {
  create: (data: CreateClaimRequest): ApiResult<ClaimDTO> =>
    httpClient.post('/claims', data).then((res) => res.data),

  getAll: (params?: { status?: string; page?: number; limit?: number }): ApiResult<{ 
    count: number;
    total: number;
    page: number;
    pages: number;
    limit: number;
    claims: ClaimDTO[] 
  }> =>
    httpClient.get('/claims', { params }).then((res) => res.data),

  getById: (id: string): ApiResult<ClaimDTO> =>
    httpClient.get(`/claims/${id}`).then((res) => res.data),

  addAttachments: (id: string, files: File[]): ApiResult<{ attachments: DocumentDTO[] }> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return httpClient.post(`/claims/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data);
  },

  addMessage: (id: string, data: ClaimMessageRequest): ApiResult<void> =>
    httpClient.post(`/claims/${id}/messages`, data).then((res) => res.data),
};

// ========================================
// NOTIFICATIONS
// ========================================
export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number }): ApiResult<{ 
    notifications: NotificationDTO[];
    total: number;
    page: number;
    pages: number;
    unreadCount: number;
  }> =>
    httpClient.get('/notifications', { params }).then((res) => res.data),

  getUnread: (): ApiResult<{ 
    notifications: NotificationDTO[];
    count: number;
  }> =>
    httpClient.get('/notifications/unread').then((res) => res.data),

  markAsRead: (id: string): ApiResult<NotificationDTO> =>
    httpClient.patch(`/notifications/${id}/read`).then((res) => res.data),

  markAllAsRead: (): ApiResult<{ modifiedCount: number }> =>
    httpClient.patch('/notifications/read-all').then((res) => res.data),
};

// Note: Dashboard API moved to adminApi section

// ========================================
// AUDIT LOGS (ADMIN)
// ========================================
export const auditLogsApi = {
  getAll: (params?: {
    action?: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): ApiResult<{ 
    logs: AuditLogDTO[];
    total: number;
    page: number;
    pages: number;
    limit: number;
  }> =>
    httpClient.get('/admin/audit-logs', { params }).then((res) => res.data),

  getById: (id: string): ApiResult<AuditLogDTO> =>
    httpClient.get(`/admin/audit-logs/${id}`).then((res) => res.data),

  getStats: (): ApiResult<AuditLogStatsDTO> =>
    httpClient.get('/admin/audit-logs/stats').then((res) => res.data),
};

// ========================================
// ADMIN API
// ========================================
export const adminApi = {
  // Dashboard
  getDashboard: (): ApiResult<{
    kpis: {
      totalUsers: number;
      totalPolicies: number;
      activePolicies: number;
      totalClaims: number;
      totalRevenue: number;
      revenueThisMonth: number;
    };
    trends: Array<{
      month: string;
      revenue: number;
      newPolicies: number;
      claims: number;
    }>;
    popularProducts: Array<{
      productCode: string;
      name: string;
      count: number;
    }>;
    documentStats: {
      totalDocuments: number;
      attestations: number;
      contracts: number;
      receipts: number;
    };
  }> =>
    httpClient.get('/admin/dashboard').then((res) => res.data),

  getKpis: (): ApiResult<{
    totalUsers: number;
    totalPolicies: number;
    activePolicies: number;
    totalQuotes?: number;
    acceptedQuotes?: number;
    quoteConversionRate?: number;
    totalClaims: number;
    pendingClaims?: number;
    settledClaims?: number;
    totalRevenue: number;
    revenueThisMonth: number;
  }> =>
    httpClient.get('/admin/dashboard/kpis').then((res) => res.data),

  getTrends: (): ApiResult<Array<{
    month: string;
    revenue: number;
    newPolicies: number;
    claims: number;
  }>> =>
    httpClient.get('/admin/dashboard/trends').then((res) => res.data),

  getPopularProducts: (): ApiResult<Array<{
    productCode: string;
    name: string;
    count: number;
  }>> =>
    httpClient.get('/admin/dashboard/products').then((res) => res.data),

  getDocumentStats: (): ApiResult<{
    totalDocuments: number;
    attestations: number;
    contracts: number;
    receipts: number;
  }> =>
    httpClient.get('/admin/dashboard/documents').then((res) => res.data),

  // Admin Quotes
  getAllQuotes: (params?: { status?: string; page?: number; limit?: number }): ApiResult<{ 
    quotes: QuoteDTO[];
    pagination: {
      total: number;
      page: number;
      pages: number;
    };
  }> =>
    httpClient.get('/admin/quotes', { params }).then((res) => res.data),

  // Admin Policies
  getAllPolicies: (params?: { status?: string; search?: string; page?: number; limit?: number }): ApiResult<{ 
    policies: PolicyDTO[];
    pagination: {
      total: number;
      page: number;
      pages: number;
    };
  }> =>
    httpClient.get('/admin/policies', { params }).then((res) => res.data),

  getPolicyStats: (): ApiResult<{
    total: number;
    active: number;
    expired: number;
    cancelled: number;
    pendingPayment: number;
  }> =>
    httpClient.get('/admin/policies/stats').then((res) => res.data),

  getPolicyById: (id: string): ApiResult<PolicyDTO> =>
    httpClient.get(`/admin/policies/${id}`).then((res) => res.data),

  regeneratePolicyDocuments: (id: string): ApiResult<{ documents: DocumentDTO[] }> =>
    httpClient.post(`/admin/policies/${id}/documents/regenerate`).then((res) => res.data),

  // Admin Users
  getAllUsers: (params?: { role?: string; isActive?: boolean; search?: string; page?: number; limit?: number }): ApiResult<{ 
    users: UserDTO[];
    pagination: {
      total: number;
      page: number;
      pages: number;
    };
  }> =>
    httpClient.get('/admin/users', { params }).then((res) => res.data),

  getUserStats: (): ApiResult<{
    total: number;
    active: number;
    inactive: number;
    byRole: {
      ADMIN: number;
      CLIENT: number;
      AGENT: number;
      EXPERT: number;
    };
    newThisMonth: number;
  }> =>
    httpClient.get('/admin/users/stats').then((res) => res.data),

  getUserById: (id: string): ApiResult<UserDTO> =>
    httpClient.get(`/admin/users/${id}`).then((res) => res.data),

  updateUserRole: (id: string, role: string): ApiResult<UserDTO> =>
    httpClient.patch(`/admin/users/${id}/role`, { role }).then((res) => res.data),

  updateUserStatus: (id: string, isActive: boolean): ApiResult<UserDTO> =>
    httpClient.patch(`/admin/users/${id}/status`, { isActive }).then((res) => res.data),

  // Admin Claims
  getAllClaims: (params?: { status?: string; search?: string; expertId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }): ApiResult<{ 
    claims: ClaimDTO[];
    count: number;
    total: number;
    page: number;
    pages: number;
    limit: number;
  }> =>
    httpClient.get('/admin/claims', { params }).then((res) => res.data),

  getClaimById: (id: string): ApiResult<ClaimDTO> =>
    httpClient.get(`/admin/claims/${id}`).then((res) => res.data),

  updateClaimStatus: (id: string, status: string, note?: string): ApiResult<ClaimDTO> =>
    httpClient.patch(`/admin/claims/${id}/status`, { status, note }).then((res) => res.data),

  assignExpert: (id: string, expertId: string, note?: string): ApiResult<ClaimDTO> =>
    httpClient.post(`/admin/claims/${id}/assign-expert`, { expertId, note }).then((res) => res.data),

  addClaimNote: (id: string, content: string, isInternal: boolean): ApiResult<ClaimDTO> =>
    httpClient.post(`/admin/claims/${id}/notes`, { content, isInternal }).then((res) => res.data),

  // Products management
  getAllProducts: (): ApiResult<any[]> =>
    httpClient.get('/admin/products').then((res) => res.data),

  getProduct: (productId: string): ApiResult<any> =>
    httpClient.get(`/admin/products/${productId}`).then((res) => res.data),

  createProduct: (productData: any): ApiResult<any> =>
    httpClient.post('/admin/products', productData).then((res) => res.data),

  updateProduct: (productId: string, productData: any): ApiResult<any> =>
    httpClient.put(`/admin/products/${productId}`, productData).then((res) => res.data),

  updateProductStatus: (productId: string, status: 'ACTIVE' | 'INACTIVE'): ApiResult<any> =>
    httpClient.patch(`/admin/products/${productId}`, { status }).then((res) => res.data),

  deleteProduct: (productId: string): ApiResult<void> =>
    httpClient.delete(`/admin/products/${productId}`).then((res) => res.data),

  // Documents management
  getAllDocuments: (params?: { type?: string; page?: number; limit?: number }): ApiResult<{
    documents: DocumentDTO[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    return httpClient.get(`/admin/documents?${queryParams.toString()}`).then((res) => res.data);
  },

  deleteDocument: (documentId: string): ApiResult<void> =>
    httpClient.delete(`/admin/documents/${documentId}`).then((res) => res.data),
};

// ========================================
// HEALTH CHECK
// ========================================
export const healthApi = {
  check: (): ApiResult<{ status: string }> =>
    httpClient.get('/health').then((res) => res.data),
};

// ========================================
// UNIFIED EXPORT
// ========================================
export const endpoints = {
  auth: authApi,
  vehicles: vehiclesApi,
  products: productsApi,
  quotes: quotesApi,
  policies: policiesApi,
  documents: documentsApi,
  claims: claimsApi,
  notifications: notificationsApi,
  auditLogs: auditLogsApi,
  admin: adminApi,
  health: healthApi,
};
