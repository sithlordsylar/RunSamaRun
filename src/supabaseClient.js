// src/supabaseClient.js
// NOTE: Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project values.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://jmkkrqaysxbyqipaoynr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impta2tycWF5c3hieXFpcGFveW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NTQyODksImV4cCI6MjA5MzUzMDI4OX0.L0s50WTSXgJqtpwCE1ePEdFkKC4m96BQarsDLIwxemA';

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
