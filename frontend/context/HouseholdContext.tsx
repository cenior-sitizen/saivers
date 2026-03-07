"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface Persona {
  id: number;
  name: string;
  label: string;
  description: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 1001,
    name: "Ahmad",
    label: "The Waster",
    description: "AC on midnight–5am at 20°C, +40% usage",
  },
  {
    id: 1002,
    name: "Priya",
    label: "The Moderate",
    description: "AC on evenings at 24°C, +5% usage",
  },
  {
    id: 1003,
    name: "Wei Ming",
    label: "The Champion",
    description: "AC on evenings at 26°C, -12% usage",
  },
];

interface HouseholdContextValue {
  householdId: number;
  persona: Persona;
  setHouseholdId: (id: number) => void;
}

const HouseholdContext = createContext<HouseholdContextValue>({
  householdId: 1001,
  persona: PERSONAS[0],
  setHouseholdId: () => {},
});

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [householdId, setHouseholdId] = useState(1001);
  const persona = PERSONAS.find((p) => p.id === householdId) ?? PERSONAS[0];
  return (
    <HouseholdContext.Provider value={{ householdId, persona, setHouseholdId }}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  return useContext(HouseholdContext);
}
