import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  createSingleFlightGate,
  type SingleFlightGate,
} from "@/services/api/single-flight";

export function useSingleFlight(): SingleFlightGate {
  const [gate] = useState(createSingleFlightGate);

  useFocusEffect(
    useCallback(() => {
      gate.reset();
      return () => {
        gate.reset();
      };
    }, [gate]),
  );

  return gate;
}
