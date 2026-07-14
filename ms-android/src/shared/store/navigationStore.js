import { create } from "zustand";

// Guarda el nombre de la pantalla realmente enfocada en toda la app.
// Se actualiza desde AppNavigator (NavigationContainer onStateChange), que es
// el único punto que siempre recibe el árbol de navegación completo y resuelto.
export const useNavigationStore = create((set) => ({
    activeRouteName: null,
    setActiveRouteName: (name) => set({ activeRouteName: name }),
}));
