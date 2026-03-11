/**
 * Corti FactsR™ service
 * Sends the full transcript at session end and returns structured clinical facts.
 */

import fetch from 'node-fetch';
import { getToken, getApiBaseUrl } from './cortiAuth.js';

/**
 * Extracts structured clinical facts from the transcript using FactsR™.
 * @param {Array} transcript - Array of { role: 'patient'|'agent', text: string }
 * @param {Object} patientInfo - { name, email, appt, reason }
 * @returns {Object} Structured facts
 */
export async function extractFacts(transcript, patientInfo) {
  const token = await getToken();
  const base = getApiBaseUrl();

  // Build a single text document from the transcript
  const fullText = transcript
    .map(t => `${t.role === 'patient' ? 'Patient' : 'Assistant'}: ${t.text}`)
    .join('\n');

  const res = await fetch(`${base}/v1/factsr/extract`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: fullText,
      context: {
        patientName: patientInfo.name,
        consultationReason: patientInfo.reason || null,
        appointmentTime: patientInfo.appt || null,
        language: 'fr',
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`FactsR extraction failed (${res.status}): ${text}`);
    // Return a minimal fallback so the session still completes
    return {
      error: true,
      rawTranscript: fullText,
      patientName: patientInfo.name,
    };
  }

  const data = await res.json();
  return {
    patientName: patientInfo.name,
    patientEmail: patientInfo.email,
    appointmentTime: patientInfo.appt,
    extractedAt: new Date().toISOString(),
    facts: data.facts || data,
    rawTranscript: fullText,
  };
}
