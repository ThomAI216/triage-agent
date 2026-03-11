/**
 * Session routes
 * POST /session/start   — create a new triage session
 * POST /session/message — send patient message, get AI response
 * POST /session/end     — end session, extract clinical facts
 */

import { Router } from 'express';
import { startSession, sendMessage } from '../services/cortiAgent.js';
import { extractFacts } from '../services/cortiFacts.js';

const router = Router();

// In-memory session store (use Redis/DB in production)
const sessions = new Map();

/**
 * POST /session/start
 * Body: { name, email, appt, reason }
 * Returns: { sessionId, contextId }
 */
router.post('/start', async (req, res) => {
  try {
    const { name, email, appt, reason } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }

    const patientInfo = { name, email, appt, reason };
    const contextId = await startSession(patientInfo);

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessions.set(sessionId, {
      contextId,
      patientInfo,
      transcript: [],
      startedAt: new Date().toISOString(),
      isFirstMessage: true,
    });

    console.log(`[session] Started ${sessionId} for ${name} (${email}), contextId: ${contextId}`);

    res.json({ sessionId, contextId });
  } catch (err) {
    console.error('[session/start]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /session/message
 * Body: { sessionId, message }
 * Returns: { text, quickReplies, redFlag, redFlagMessage, sessionComplete }
 */
router.post('/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message?.trim()) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    // Save patient message to transcript
    session.transcript.push({ role: 'patient', text: message.trim() });

    // Call Corti Orchestrator
    const response = await sendMessage({
      contextId: session.contextId,
      patientMessage: message.trim(),
      patientInfo: session.patientInfo,
      // Pass consultation reason only on first message for context priming
      consultationReason: session.isFirstMessage ? session.patientInfo.reason : null,
    });

    session.isFirstMessage = false;

    // Save agent response to transcript
    if (response.text) {
      session.transcript.push({ role: 'agent', text: response.text });
    }

    // If session is complete, extract facts automatically
    if (response.sessionComplete) {
      try {
        const facts = await extractFacts(session.transcript, session.patientInfo);
        session.facts = facts;
        console.log(`[session] ${sessionId} completed, facts extracted`);
      } catch (factsErr) {
        console.error('[session] FactsR error:', factsErr.message);
      }
    }

    res.json(response);
  } catch (err) {
    console.error('[session/message]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /session/end
 * Body: { sessionId }
 * Returns: { facts }
 */
router.post('/end', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    // Extract facts if not already done
    if (!session.facts) {
      session.facts = await extractFacts(session.transcript, session.patientInfo);
    }

    const summary = {
      sessionId,
      patientInfo: session.patientInfo,
      startedAt: session.startedAt,
      endedAt: new Date().toISOString(),
      messageCount: session.transcript.length,
      facts: session.facts,
    };

    // Clean up session from memory (log/store to DB in production)
    sessions.delete(sessionId);
    console.log(`[session] ${sessionId} ended and removed from memory`);

    res.json(summary);
  } catch (err) {
    console.error('[session/end]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
