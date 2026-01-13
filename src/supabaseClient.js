// src/supabaseClient.js
// WARNING: The Supabase URL and anonymous key are exposed here.
// In a production environment, it's crucial to handle these securely.
// Best practice is to use a backend proxy to interact with Supabase,
// keeping your credentials private and enabling more robust server-side validation.
// This helps prevent unauthorized access and abuse of your database.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://ybgrtcmwpgqcgjmjbitz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZ3J0Y213cGdxY2dqbWpiaXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Njc2NzQsImV4cCI6MjA3MTI0MzY3NH0.Bc6JyM_09I1lOMQb1wv6km9-81F5p6hwFnTSuFAM3yWI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let submitting = false;

/** Submit a player score safely */
export async function submitScore({ name, message, score }) {
  if (submitting) return { error: "Already submitting" };
  submitting = true;

  try {
    name = String(name || 'Player').slice(0, 32);
    message = String(message || '').slice(0, 140);
    score = Number(score) || 0;

    // Basic client-side validation
    if (score > 999999) {
      return { error: "Invalid score" };
    }

    const { data, error } = await supabase
      .from('scores')
      .insert([{ name, message, score }])
      .select();

    if (error) throw error;
    return { data };
  } catch (err) {
    console.error('submitScore failed:', err);
    return { error: err.message || 'Unknown error' };
  } finally {
    submitting = false; // ✅ always reset even if error happens
  }
}

/** Fetch top leaderboard scores */
export async function fetchTopScores(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('id,created_at,name,message,score')
      .order('score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data };
  } catch (err) {
    console.error('fetchTopScores failed:', err);
    return { error: err.message || 'Unknown error' };
  }
}
