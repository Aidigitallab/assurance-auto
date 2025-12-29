const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const adminVehicleRoutes = require('./routes/admin.vehicle.routes');
const productRoutes = require('./routes/product.routes');
const adminProductRoutes = require('./routes/admin.product.routes');
const quoteRoutes = require('./routes/quote.routes');
const adminQuoteRoutes = require('./routes/admin.quote.routes');
const policyRoutes = require('./routes/policy.routes');
const adminPolicyRoutes = require('./routes/admin.policy.routes');
const documentRoutes = require('./routes/document.routes');
const adminDocumentRoutes = require('./routes/admin.document.routes');
const claimRoutes = require('./routes/claim.routes');
const adminClaimRoutes = require('./routes/admin.claim.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminDashboardRoutes = require('./routes/admin.dashboard.routes');
const adminAuditRoutes = require('./routes/admin.audit.routes');
const adminUserRoutes = require('./routes/admin.user.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const { sendError } = require('./utils/apiResponse');

const app = express();

// Middlewares de sécurité
app.use(helmet());
app.use(morgan('dev'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - ouvert pour le développement
app.use(cors({
  origin: '*',
  credentials: true
}));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/admin/vehicles', adminVehicleRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/admin/quotes', adminQuoteRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/admin/policies', adminPolicyRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin/documents', adminDocumentRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/admin/claims', adminClaimRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/audit-logs', adminAuditRoutes);
app.use('/api/admin/users', adminUserRoutes);

// Gestion 404 - Route non trouvée
app.use((req, res, next) => {
  return sendError(res, 'Route non trouvée', 404);
});

// Middleware de gestion d'erreur global
app.use(errorMiddleware);

module.exports = app;
