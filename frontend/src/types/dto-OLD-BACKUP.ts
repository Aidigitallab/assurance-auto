// Types DTO basés sur le backend - EXACTEMENT selon la spec

// ========================================
// USER & AUTH
// ========================================
export type UserRole = 'CLIENT' | 'ADMIN' | 'AGENT' | 'EXPERT';

export interface UserDTO {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserDTO;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role?: UserRole;
}

// ========================================
// VEHICLE
// ========================================
export interface VehicleDTO {
  id: number;
  userId: number;
  marque: string;
  modele: string;
  immatriculation: string;
  annee: number;
  valeur: number;
  dateAchat: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleRequest {
  marque: string;
  modele: string;
  immatriculation: string;
  annee: number;
  valeur: number;
  dateAchat: string;
}

export interface UpdateVehicleRequest {
  marque?: string;
  modele?: string;
  immatriculation?: string;
  annee?: number;
  valeur?: number;
  dateAchat?: string;
}

// ========================================
// PRODUCT
// ========================================
export interface ProductDTO {
  id: number;
  code: string;
  name: string;
  description: string;
  basePrice: number;
  coverageOptions: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// QUOTE
// ========================================
export type QuoteStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface QuoteDTO {
  id: number;
  userId: number;
  vehicleId: number;
  productCode: string;
  coverageOptions?: string[];
  requestedStartDate?: string;
  amount: number;
  status: QuoteStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  vehicle?: VehicleDTO;
  product?: ProductDTO;
}

export interface CreateQuoteRequest {
  vehicleId: number;
  productCode: string;
  coverageOptions?: string[];
  requestedStartDate?: string;
}

// ========================================
// POLICY
// ========================================
export type PolicyStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';

export interface PolicyDTO {
  id: number;
  userId: number;
  quoteId: number;
  vehicleId: number;
  productCode: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: PolicyStatus;
  paymentMethod: string;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
  quote?: QuoteDTO;
  vehicle?: VehicleDTO;
}

export interface CreatePolicyRequest {
  quoteId: number;
  startDate: string;
  endDate: string;
  paymentMethod: string;
  paymentReference?: string;
}

export interface RenewPolicyRequest {
  paymentMethod: string;
  paymentReference?: string;
}

export interface CancelPolicyRequest {
  reason: string;
}

// ========================================
// DOCUMENT
// ========================================
export type DocumentType = 'POLICY' | 'QUOTE' | 'CLAIM' | 'OTHER';

export interface DocumentDTO {
  id: number;
  entityType: DocumentType;
  entityId: number;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

// ========================================
// CLAIM
// ========================================
export type ClaimStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CLOSED';

export interface ClaimIncident {
  date: string;
  location: string;
  type: string;
  description: string;
}

export interface ClaimDTO {
  id: number;
  userId: number;
  policyId: number;
  incident: ClaimIncident;
  status: ClaimStatus;
  createdAt: string;
  updatedAt: string;
  policy?: PolicyDTO;
}

export interface CreateClaimRequest {
  policyId: number;
  incident: ClaimIncident;
}

export interface ClaimMessageRequest {
  message: string;
}

// ========================================
// NOTIFICATION
// ========================================
export type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';

export interface NotificationDTO {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ========================================
// DASHBOARD (ADMIN)
// ========================================
export interface DashboardKPIsDTO {
  totalUsers: number;
  totalPolicies: number;
  totalRevenue: number;
  activeClaims: number;
  pendingQuotes: number;
}

export interface DashboardTrendsDTO {
  month: string;
  policies: number;
  revenue: number;
  claims: number;
}

export interface DashboardProductStatsDTO {
  productCode: string;
  productName: string;
  totalPolicies: number;
  revenue: number;
}

// ========================================
// AUDIT LOG (ADMIN)
// ========================================
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT';
export type AuditEntityType = 'USER' | 'VEHICLE' | 'QUOTE' | 'POLICY' | 'CLAIM' | 'DOCUMENT';

export interface AuditLogDTO {
  id: number;
  actor: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: number;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogStatsDTO {
  totalLogs: number;
  actionCounts: Record<AuditAction, number>;
  entityTypeCounts: Record<AuditEntityType, number>;
}
