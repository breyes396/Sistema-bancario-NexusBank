// Baja recursivamente por un estado de navegación (React Navigation) hasta
// encontrar el nombre de la pantalla realmente enfocada (la hoja del árbol).
export const getActiveRouteName = (state) => {
    if (!state || state.index == null) return null;
    const route = state.routes[state.index];
    return route.state ? getActiveRouteName(route.state) : route.name;
};
