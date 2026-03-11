import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sessionRouter from './routes/session.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — allow only our frontend in development
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/session', sessionRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Convent Clinic Triage API', time: new Date().toISOString() });
});

// Start
app.listen(PORT, () => {
  console.log(`✅ Convent Clinic Triage backend running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.CORTI_ENVIRONMENT || '(not set)'}`);
  console.log(`   Tenant:      ${process.env.CORTI_TENANT || '(not set)'}`);
});
