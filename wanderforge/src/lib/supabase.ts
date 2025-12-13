// Supabase Client Configuration for Real-Time Tracking
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Create client only if credentials are available
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      })
    : null;

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

// Database Types (matching Supabase schema)

export interface DbGroup {
  id: string;
  code: string;
  name: string;
  creator_id: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export interface DbMember {
  id: string;
  group_id: string;
  device_id: string;
  name: string;
  avatar: string;
  email: string | null;  // Email for SOS notifications
  joined_at: string;
  is_active: boolean;
}

export interface DbLocation {
  id: number;
  member_id: string;
  group_id: string;
  lat: number;
  lng: number;
  accuracy_m: number;
  battery_percent: number;
  signal_strength: number;
  is_moving: boolean;
  timestamp: string;
}

// Type helpers for Supabase responses
export type GroupInsert = Omit<DbGroup, 'id' | 'created_at'>;
export type MemberInsert = Omit<DbMember, 'joined_at'>;
export type LocationInsert = Omit<DbLocation, 'id' | 'timestamp'>;
