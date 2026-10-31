// src/hooks/use-location.ts
// Requests foreground location permission and returns the current coordinates.
// Falls back to Denpasar, Bali if permission is denied.

import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';

import { Config } from '@/constants/config';

export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error';

interface LocationState {
  lat: number;
  lng: number;
  status: LocationStatus;
  isDefaultFallback: boolean;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    lat: Config.defaultLat,
    lng: Config.defaultLng,
    status: 'idle',
    isDefaultFallback: true,
  });

  const requestLocation = useCallback(async () => {
    setState((s) => ({ ...s, status: 'requesting' }));
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState((s) => ({ ...s, status: 'denied', isDefaultFallback: true }));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
      });
      setState({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        status: 'granted',
        isDefaultFallback: false,
      });
    } catch {
      setState((s) => ({ ...s, status: 'error', isDefaultFallback: true }));
    }
  }, []);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { ...state, requestLocation, openSettings };
}
