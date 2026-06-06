import { createClient } from '@supabase/supabase-js';

// Retrieve Supabase credentials from environment variables safely with cast
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL;
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY;

// Lazy initialization of active Supabase client to prevent module-load crashes
export const isSupabaseConfigured = (): boolean => {
  return typeof supabaseUrl === 'string' && 
         supabaseUrl.trim() !== '' && 
         typeof supabaseAnonKey === 'string' &&
         supabaseAnonKey.trim() !== '';
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Generate or retrieve a persistent unique user ID for this browser session/device
export const getUserId = (): string => {
  let userId = localStorage.getItem('derby_user_uuid');
  if (!userId) {
    const randomArray = new Uint32Array(4);
    window.crypto.getRandomValues(randomArray);
    userId = 'runner_' + Array.from(randomArray, dec => dec.toString(16).padStart(8, '0')).join('');
    localStorage.setItem('derby_user_uuid', userId);
  }
  return userId;
};

interface SupabaseState {
  balance: number;
  history: any[];
}

/**
 * Fetches the user state (balance and history) from the Supabase 'user_balances' table.
 * If the user record doesn't exist, it is created with default values.
 */
export async function getGameDataFromSupabase(): Promise<SupabaseState | null> {
  if (!supabase) return null;
  const uid = getUserId();

  try {
    const { data, error } = await supabase
      .from('user_balances')
      .select('balance, history')
      .eq('user_id', uid)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      throw error;
    }

    if (!data) {
      // Create new record for this user
      const defaultState: SupabaseState = { balance: 100000, history: [] };
      const { error: insertError } = await supabase
        .from('user_balances')
        .insert({
          user_id: uid,
          balance: defaultState.balance,
          history: defaultState.history,
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.warn('Supabase insert default error:', insertError.message);
        throw insertError;
      }
      return defaultState;
    }

    return {
      balance: Number(data.balance),
      history: Array.isArray(data.history) ? data.history : []
    };
  } catch (err) {
    console.error('Error in getGameDataFromSupabase:', err);
    throw err;
  }
}

/**
 * Updates or inserts (upsert) the current balance and betting history to Supabase 'user_balances' table.
 */
export async function saveGameDataToSupabase(balance: number, history: any[]): Promise<boolean> {
  if (!supabase) return false;
  const uid = getUserId();

  try {
    const { error } = await supabase
      .from('user_balances')
      .upsert({
        user_id: uid,
        balance: balance,
        history: history,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Supabase upsert error:', error.message);
      throw error;
    }
    return true;
  } catch (err) {
    console.error('Error in saveGameDataToSupabase:', err);
    throw err;
  }
}
