# 📡 API Endpoints - Frontend TypeScript

Tous les endpoints sont implémentés dans `src/api/endpoints.ts` avec typage complet TypeScript.

## 🔐 Auth

```typescript
import { authApi } from '@/api/endpoints';

// Register
await authApi.register({ email, password, nom, prenom, telephone?, role? });
// Returns: ApiResult<UserDTO>

// Login
await authApi.login({ email, password });
// Returns: ApiResult<AuthResponse> where AuthResponse = { token, user }

// Get current user
await authApi.getMe();
// Returns: ApiResult<UserDTO>
```

## 🚗 Vehicles (CLIENT)

```typescript
import { vehiclesApi } from '@/api/endpoints';

// Create vehicle
await vehiclesApi.create({ marque, modele, immatriculation, annee, valeur, dateAchat });
// POST /vehicles - Returns: ApiResult<VehicleDTO>

// Get all vehicles
await vehiclesApi.getAll();
// GET /vehicles - Returns: ApiResult<{ vehicles: VehicleDTO[] }>

// Get vehicle by ID
await vehiclesApi.getById(id);
// GET /vehicles/:id - Returns: ApiResult<VehicleDTO>

// Update vehicle
await vehiclesApi.update(id, { marque?, modele?, ... });
// PUT /vehicles/:id - Returns: ApiResult<VehicleDTO>

// Delete (archive) vehicle
await vehiclesApi.delete(id);
// DELETE /vehicles/:id - Returns: ApiResult<void>
```

## 📦 Products (CLIENT)

```typescript
import { productsApi } from '@/api/endpoints';

// Get all products
await productsApi.getAll();
// GET /products - Returns: ApiResult<{ products: ProductDTO[] }>

// Get product by ID
await productsApi.getById(id);
// GET /products/:id - Returns: ApiResult<ProductDTO>
```

## 📋 Quotes (CLIENT)

```typescript
import { quotesApi } from '@/api/endpoints';

// Create quote
await quotesApi.create({
  vehicleId: 1,
  productCode: 'BASIC',
  coverageOptions: ['collision', 'theft'],
  requestedStartDate: '2025-01-01'
});
// POST /quotes - Returns: ApiResult<QuoteDTO>

// Get all quotes (optional status filter)
await quotesApi.getAll({ status: 'PENDING' });
// GET /quotes?status=PENDING - Returns: ApiResult<{ quotes: QuoteDTO[] }>

// Get quote by ID
await quotesApi.getById(id);
// GET /quotes/:id - Returns: ApiResult<QuoteDTO>

// Expire quote
await quotesApi.expire(id);
// POST /quotes/:id/expire - Returns: ApiResult<QuoteDTO>
```

## 📄 Policies (CLIENT)

```typescript
import { policiesApi } from '@/api/endpoints';

// Create policy
await policiesApi.create({
  quoteId: 1,
  startDate: '2025-01-01',
  endDate: '2026-01-01',
  paymentMethod: 'CREDIT_CARD',
  paymentReference: 'ref123'
});
// POST /policies - Returns: ApiResult<PolicyDTO>

// Get all policies (with pagination)
await policiesApi.getAll({ status: 'ACTIVE', page: 1, limit: 10 });
// GET /policies?status=ACTIVE&page=1&limit=10
// Returns: ApiResult<{ policies: PolicyDTO[], total, page, limit }>

// Get policy by ID
await policiesApi.getById(id);
// GET /policies/:id - Returns: ApiResult<PolicyDTO>

// Get policy documents
await policiesApi.getDocuments(id);
// GET /policies/:id/documents - Returns: ApiResult<{ documents: DocumentDTO[] }>

// Renew policy
await policiesApi.renew(id, { paymentMethod: 'CREDIT_CARD', paymentReference?: 'ref456' });
// PATCH /policies/:id/renew - Returns: ApiResult<PolicyDTO>

// Cancel policy
await policiesApi.cancel(id, { reason: 'Vehicle sold' });
// PATCH /policies/:id/cancel - Returns: ApiResult<PolicyDTO>
```

## 📎 Documents

```typescript
import { documentsApi, downloadDocument } from '@/api/endpoints';

// Download document (returns Blob)
const blob = await documentsApi.download(docId);
// GET /documents/:id/download - Returns: Promise<Blob>

// Utility: Download & trigger browser download
await downloadDocument(docId, 'my-policy.pdf');
// Downloads document and saves as file in browser
```

## 🚨 Claims (CLIENT)

```typescript
import { claimsApi } from '@/api/endpoints';

// Create claim
await claimsApi.create({
  policyId: 1,
  incident: {
    date: '2025-12-20',
    location: 'Paris, France',
    type: 'COLLISION',
    description: 'Rear-end collision at intersection'
  }
});
// POST /claims - Returns: ApiResult<ClaimDTO>

// Get all claims (with pagination)
await claimsApi.getAll({ status: 'PENDING', page: 1, limit: 10 });
// GET /claims?status=PENDING&page=1&limit=10
// Returns: ApiResult<{ claims: ClaimDTO[], total, page, limit }>

// Get claim by ID
await claimsApi.getById(id);
// GET /claims/:id - Returns: ApiResult<ClaimDTO>

// Add attachments (max 5 files)
const files = [file1, file2]; // File[] from input type="file"
await claimsApi.addAttachments(id, files);
// POST /claims/:id/attachments (multipart/form-data)
// Returns: ApiResult<{ attachments: DocumentDTO[] }>

// Add message to claim
await claimsApi.addMessage(id, { message: 'Update on claim status' });
// POST /claims/:id/messages - Returns: ApiResult<void>
```

## 🔔 Notifications (CLIENT)

```typescript
import { notificationsApi } from '@/api/endpoints';

// Get all notifications (with pagination)
await notificationsApi.getAll({ page: 1, limit: 20 });
// GET /notifications?page=1&limit=20
// Returns: ApiResult<{ notifications: NotificationDTO[], total, page, limit }>

// Get unread notifications
await notificationsApi.getUnread();
// GET /notifications/unread - Returns: ApiResult<{ notifications: NotificationDTO[] }>

// Get unread count
await notificationsApi.getCount();
// GET /notifications/count - Returns: ApiResult<{ count: number }>

// Mark notification as read
await notificationsApi.markAsRead(id);
// PATCH /notifications/:id/read - Returns: ApiResult<NotificationDTO>

// Mark all as read
await notificationsApi.markAllAsRead();
// PATCH /notifications/read-all - Returns: ApiResult<void>
```

## 📊 Dashboard (ADMIN)

```typescript
import { dashboardApi } from '@/api/endpoints';

// Get overview
await dashboardApi.getOverview({ months: 6 });
// GET /admin/dashboard?months=6 - Returns: ApiResult<any>

// Get KPIs
await dashboardApi.getKPIs({ from: '2025-01-01', to: '2025-12-31' });
// GET /admin/dashboard/kpis?from=2025-01-01&to=2025-12-31
// Returns: ApiResult<DashboardKPIsDTO>

// Get trends
await dashboardApi.getTrends({ months: 12 });
// GET /admin/dashboard/trends?months=12
// Returns: ApiResult<{ trends: DashboardTrendsDTO[] }>

// Get product statistics
await dashboardApi.getProductStats({ limit: 5 });
// GET /admin/dashboard/products?limit=5
// Returns: ApiResult<{ products: DashboardProductStatsDTO[] }>

// Get documents
await dashboardApi.getDocuments();
// GET /admin/dashboard/documents
// Returns: ApiResult<{ documents: DocumentDTO[] }>
```

## 📝 Audit Logs (ADMIN)

```typescript
import { auditLogsApi } from '@/api/endpoints';

// Get all audit logs (with filters)
await auditLogsApi.getAll({
  actor: 'user@example.com',
  action: 'CREATE',
  entityType: 'POLICY',
  entityId: 123,
  from: '2025-01-01',
  to: '2025-12-31',
  page: 1,
  limit: 50
});
// GET /admin/audit-logs?actor=...&action=...
// Returns: ApiResult<{ logs: AuditLogDTO[], total, page, limit }>

// Get logs for specific entity
await auditLogsApi.getByEntity('POLICY', 123);
// GET /admin/audit-logs/entity/POLICY/123
// Returns: ApiResult<{ logs: AuditLogDTO[] }>

// Get statistics
await auditLogsApi.getStats();
// GET /admin/audit-logs/stats
// Returns: ApiResult<AuditLogStatsDTO>

// Get log by ID
await auditLogsApi.getById(id);
// GET /admin/audit-logs/:id - Returns: ApiResult<AuditLogDTO>
```

## 💚 Health Check

```typescript
import { healthApi } from '@/api/endpoints';

// Check API health
await healthApi.check();
// GET /health - Returns: ApiResult<{ status: string }>
```

---

## 🎯 Response Format

All endpoints return `ApiResponse<T>`:

```typescript
// Success
{
  success: true,
  message: string,
  data: T
}

// Error
{
  success: false,
  message: string,
  errors?: any[]
}
```

## 🔧 Usage Example

```typescript
import { policiesApi } from '@/api/endpoints';
import { toast } from 'sonner';

const fetchPolicies = async () => {
  try {
    const response = await policiesApi.getAll({ status: 'ACTIVE', page: 1, limit: 10 });
    
    if (response.success) {
      console.log('Policies:', response.data.policies);
      console.log('Total:', response.data.total);
    } else {
      toast.error(response.message);
    }
  } catch (error) {
    console.error('Error:', error);
    toast.error('Failed to fetch policies');
  }
};
```

## 🔐 Authentication

All requests automatically include the JWT token from localStorage via axios interceptor in `src/api/http.ts`:

```typescript
headers: {
  Authorization: `Bearer ${token}`
}
```

## ✅ All DTOs Defined

See `src/types/dto.ts` for complete type definitions:
- ✅ UserDTO, AuthResponse
- ✅ VehicleDTO, CreateVehicleRequest, UpdateVehicleRequest
- ✅ ProductDTO
- ✅ QuoteDTO, CreateQuoteRequest
- ✅ PolicyDTO, CreatePolicyRequest, RenewPolicyRequest, CancelPolicyRequest
- ✅ DocumentDTO
- ✅ ClaimDTO, CreateClaimRequest, ClaimIncident, ClaimMessageRequest
- ✅ NotificationDTO
- ✅ DashboardKPIsDTO, DashboardTrendsDTO, DashboardProductStatsDTO
- ✅ AuditLogDTO, AuditLogStatsDTO, AuditAction, AuditEntityType
