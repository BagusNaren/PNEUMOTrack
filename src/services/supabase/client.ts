// src/services/supabase/client.ts
// Supabase client configured for React Native with AsyncStorage session persistence.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

import { Config } from '@/constants/config';

const isServer = Platform.OS === 'web' && typeof window === 'undefined';

export const supabase = createClient(Config.supabaseUrl, Config.supabaseAnonKey, {
  auth: {
    storage: isServer ? undefined : AsyncStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});
