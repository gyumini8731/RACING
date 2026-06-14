import { createClient } from '@supabase/supabase-js';

// Retrieve Supabase credentials from environment variables safely with cast
const metaEnv = (import.meta as any).env || {};
const initSupabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const initSupabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

// Retrieve actual config, checking for UI-configured custom credentials first
export const getSupabaseConfig = () => {
  const isDisabled = localStorage.getItem('supabase_sync_disabled') === 'true';
  const customUrl = localStorage.getItem('supabase_custom_url');
  const customKey = localStorage.getItem('supabase_custom_anon_key');
  
  const resolvedUrl = (customUrl && customUrl.trim() !== '') ? customUrl.trim() : (initSupabaseUrl ? initSupabaseUrl.trim() : '');
  const resolvedKey = (customKey && customKey.trim() !== '') ? customKey.trim() : (initSupabaseAnonKey ? initSupabaseAnonKey.trim() : '');
  
  return {
    url: isDisabled ? '' : resolvedUrl,
    key: isDisabled ? '' : resolvedKey,
    rawUrl: resolvedUrl,
    rawKey: resolvedKey,
    isCustom: !!(customUrl && customUrl.trim() !== ''),
    isEnvProvided: !!(initSupabaseUrl && initSupabaseUrl.trim() !== ''),
    isDisabled
  };
};

// Lazy initialization of active Supabase client
export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  if (typeof url !== 'string' || url.trim() === '' || typeof key !== 'string' || key.trim() === '') {
    return false;
  }
  
  const cleanUrl = url.trim();
  const cleanKey = key.trim();
  
  // URL validation: must start with http:// or https:// and not be a template placeholder
  if (!cleanUrl.startsWith('https://') && !cleanUrl.startsWith('http://')) {
    return false;
  }
  
  const placeholders = [
    '회원님의', 
    'your-project', 
    'your-supabase', 
    'your_project', 
    'placeholder', 
    'your-url', 
    'insert-your',
    'your-anon-key'
  ];
  
  if (placeholders.some(p => cleanUrl.toLowerCase().includes(p) || cleanKey.toLowerCase().includes(p))) {
    return false;
  }
  
  // Anon key is a long JWT (typically > 40 chars)
  if (cleanKey.length < 35) {
    return false;
  }
  
  return true;
};

// Get the active Supabase client instance
export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const { url, key } = getSupabaseConfig();
  try {
    return createClient(url, key);
  } catch (e) {
    console.warn("Supabase client init warning:", e);
    return null;
  }
};

// Export initial client
export let supabase = getSupabaseClient();

// Disable or enable Supabase sync dynamically
export const setSupabaseSyncDisabled = (disabled: boolean) => {
  if (disabled) {
    localStorage.setItem('supabase_sync_disabled', 'true');
  } else {
    localStorage.removeItem('supabase_sync_disabled');
  }
  supabase = getSupabaseClient();
};

// Updates/Resets custom Supabase configs from UI
export const updateSupabaseCredentials = (url: string | null, key: string | null): boolean => {
  if (url === null || key === null) {
    localStorage.removeItem('supabase_custom_url');
    localStorage.removeItem('supabase_custom_anon_key');
  } else {
    localStorage.setItem('supabase_custom_url', url.trim());
    localStorage.setItem('supabase_custom_anon_key', key.trim());
  }
  
  // Re-instantiate the singleton client
  supabase = getSupabaseClient();
  return isSupabaseConfigured();
};

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
  const client = getSupabaseClient();
  if (!client) return null;
  const uid = getUserId();

  try {
    const { data, error } = await client
      .from('user_balances')
      .select('balance, history')
      .eq('user_id', uid)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch issue:', error.message);
      if (error.message && (error.message.includes('API key') || error.message.includes('JWT') || error.message.includes('Invalid API key') || error.message.includes('apiKey'))) {
        setSupabaseSyncDisabled(true);
      }
      throw error;
    }

    if (!data) {
      // Create new record for this user
      const defaultState: SupabaseState = { balance: 100000, history: [] };
      const { error: insertError } = await client
        .from('user_balances')
        .insert({
          user_id: uid,
          balance: defaultState.balance,
          history: defaultState.history,
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.warn('Supabase insert default warning:', insertError.message);
        if (insertError.message && (insertError.message.includes('API key') || insertError.message.includes('JWT') || insertError.message.includes('Invalid API key') || insertError.message.includes('apiKey'))) {
          setSupabaseSyncDisabled(true);
        }
        throw insertError;
      }
      return defaultState;
    }

    return {
      balance: Number(data.balance),
      history: Array.isArray(data.history) ? data.history : []
    };
  } catch (err: any) {
    console.warn('Warning in getGameDataFromSupabase:', err);
    throw err;
  }
}

/**
 * Updates or inserts (upsert) the current balance and betting history to Supabase 'user_balances' table.
 */
export async function saveGameDataToSupabase(balance: number, history: any[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const uid = getUserId();

  try {
    const { error } = await client
      .from('user_balances')
      .upsert({
        user_id: uid,
        balance: balance,
        history: history,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.warn('Supabase upsert warning:', error.message);
      if (error.message && (error.message.includes('API key') || error.message.includes('JWT') || error.message.includes('Invalid API key') || error.message.includes('apiKey'))) {
        setSupabaseSyncDisabled(true);
      }
      throw error;
    }
    return true;
  } catch (err: any) {
    console.warn('Warning in saveGameDataToSupabase:', err);
    throw err;
  }
}

