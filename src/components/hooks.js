// hooks.js
import { useState } from 'react';

export const usePlaceState = () => {
  const [places, setPlaces] = useState([]);
  const [nextPlaceId, setNextPlaceId] = useState(1);
  return { places, setPlaces, nextPlaceId, setNextPlaceId };
};

export const useTransitionState = () => {
  const [transitions, setTransitions] = useState([]);
  const [nextTransitionId, setNextTransitionId] = useState(1);
  return { transitions, setTransitions, nextTransitionId, setNextTransitionId };
};

export const useArcState = () => {
  const [arcs, setArcs] = useState([]);
  return { arcs, setArcs };
};

export const useModeState = () => {
  const [mode, setMode] = useState("edit");
  return { mode, setMode };
};
