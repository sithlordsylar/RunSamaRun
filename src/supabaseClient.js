// src/supabaseClient.js
// NOTE: Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project values.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://ybgrtcmwpgqcgjmjbitz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZ3J0Y213cGdxY2dqbWpiaXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Njc2NzQsImV4cCI6MjA3MTI0MzY3NH0.Bc6JyM09I1lOMQb1wv6km9-81F5p6hwFnTSuFAM3yWI';

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
