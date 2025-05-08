//not in use

/*import { create } from 'zustand';

const usePetriNet = create((set) => ({
  places: [],
  transitions: [],
  arcs: [],
  addPlace: (x, y) =>
    set((state) => ({
      places: [...state.places, { id: `P${state.places.length + 1}`, x, y, tokens: 1 }],
    })),
  addTransition: (x, y) =>
    set((state) => ({
      transitions: [...state.transitions, { id: `T${state.transitions.length + 1}`, x, y }],
    })),
  addArc: (from, to) =>
    set((state) => ({
      arcs: [...state.arcs, { from, to }],
    })),
}));

export default usePetriNet;*/

import { create } from "zustand";

const usePetriNet = create((set) => ({
  mode: "place", // Can be 'place', 'transition', or 'arc'
  places: [],
  transitions: [],
  arcs: [],
  connectingFrom: null, // Stores the ID of the element being connected

  setMode: (mode) => set({ mode }),
  
  addPlace: (x, y) =>
    set((state) => ({
      places: [...state.places, { id: `P${state.places.length + 1}`, x, y, tokens: 1 , type: "place"}],
    })),

  addTransition: (x, y) =>
    set((state) => ({
      transitions: [...state.transitions, { id: `T${state.transitions.length + 1}`, x, y , type: "transition"}],
    })),

  startConnection: (id) =>
    set((state) => ({ connectingFrom: id })),

    completeConnection: (id) =>
      set((state) => {
        const { connectingFrom, arcs, places, transitions } = state;
        if (!connectingFrom || connectingFrom === id) return { connectingFrom: null };
    
        const fromType = places.some((p) => p.id === connectingFrom) ? "place" : "transition";
        const toType = places.some((p) => p.id === id) ? "place" : "transition";
    
        //only Place -> Action or Action -> Place
        if (fromType !== toType) {
          return {
            arcs: [...arcs, { from: connectingFrom, to: id }],
            connectingFrom: null,
          };
        }
        return { connectingFrom: null };
      }),
    
}));

export default usePetriNet;