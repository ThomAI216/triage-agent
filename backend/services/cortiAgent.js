/**
 * Corti Agentic Framework service
 * Handles session creation and message exchange with the Orchestrator.
 */

import fetch from 'node-fetch';
import { getToken, getApiBaseUrl } from './cortiAuth.js';

// System prompt for the triage agent (French-first)
const TRIAGE_SYSTEM_PROMPT = `Tu es un assistant de pré-consultation médicale pour la Clinique Convent. 
Ton rôle est de recueillir les informations sur les symptômes du patient AVANT sa consultation avec le médecin.

Règles importantes :
1. Pose UNE seule question à la fois. Sois concis et bienveillant.
2. Commence toujours par confirmer le motif de consultation si fourni, sinon demande-le.
3. Explore les symptômes avec les dimensions clés : durée, intensité (1-10), localisation, type de douleur, facteurs aggravants/soulageants, symptômes associés.
4. Si tu détectes un SIGNE D'ALARME (douleur thoracique avec irradiation, pire céphalée de la vie, difficulté respiratoire sévère, perte de conscience, AVC potentiel), réponds UNIQUEMENT avec : {"redFlag": true, "message": "...message d'urgence..."}
5. Après 6 à 10 échanges, termine la session avec : {"sessionComplete": true}
6. Avec chaque réponse normale, fournis optionnellement des suggestions de réponse rapide dans ce format : {"text": "...ta question...", "quickReplies": ["Oui", "Non", "Parfois"]}
7. Reste dans le domaine médical. Ne pose pas de questions non pertinentes.
8. Tutoie le patient de manière chaleureuse mais professionnelle.

Tu parles en français. Si le patient répond en anglais, continue en français.`;

/**
 * Starts a new triage session. Returns a contextId.
 */
export async function startSession(patientInfo) {
  const token = await getToken();
  const base = getApiBaseUrl();

  // Create a new context with initial patient info
  const res = await fetch(`${base}/v1/agentic/contexts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      metadata: {
        patientName: patientInfo.name,
        patientEmail: patientInfo.email,
        appointmentTime: patientInfo.appt,
        consultationReason: patientInfo.reason || null,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create Corti context (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.id || data.contextId;
}

/**
 * Sends a patient message to the Orchestrator and returns the AI response.
 * Returns: { text, quickReplies, redFlag, sessionComplete }
 */
export async function sendMessage({ contextId, patientMessage, patientInfo, consultationReason }) {
  const token = await getToken();
  const base = getApiBaseUrl();

  // Build the parts array — text message + optional data context
  const parts = [
    { type: 'text', text: patientMessage },
  ];

  // If this is the first message and we have a consultation reason, attach it as data
  if (consultationReason) {
    parts.push({
      type: 'data',
      data: {
        consultationReason,
        patientName: patientInfo?.name,
        appointmentTime: patientInfo?.appt,
      },
    });
  }

  const body = {
    contextId,
    systemPrompt: TRIAGE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        parts,
      },
    ],
  };

  const res = await fetch(`${base}/v1/agentic/orchestrator/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Corti Orchestrator error (${res.status}): ${text}`);
  }

  const data = await res.json();

  // Extract the assistant message text
  const rawText = data.message?.parts?.find(p => p.type === 'text')?.text
    || data.choices?.[0]?.message?.content
    || '';

  // Try to parse JSON from the response if the model returned structured data
  return parseAgentResponse(rawText);
}

/**
 * Parses the agent response which may be plain text or structured JSON.
 */
function parseAgentResponse(rawText) {
  // Try to extract JSON block if present
  const jsonMatch = rawText.match(/{[\s\S]*}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        text: parsed.text || rawText,
        quickReplies: parsed.quickReplies || [],
        redFlag: parsed.redFlag || false,
        redFlagMessage: parsed.message || null,
        sessionComplete: parsed.sessionComplete || false,
      };
    } catch {
      // Not valid JSON — treat as plain text
    }
  }

  return {
    text: rawText,
    quickReplies: [],
    redFlag: false,
    redFlagMessage: null,
    sessionComplete: false,
  };
}
