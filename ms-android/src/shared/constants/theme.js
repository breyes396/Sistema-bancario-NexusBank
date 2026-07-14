export const COLORS = {
    primary: "#08316D", // Deep Blue
    primaryDark: "#031c42",
    secondary: "#64748b", // Slate 500
    background: "#f8fafc", // Slate 50
    surface: "#ffffff",
    text: "#0f172a", // Slate 900
    textLight: "#64748b", // Slate 500
    error: "#ef4444", // Red 500
    success: "#22c55e", // Green 500
    warning: "#f59e0b", // Amber 500
    border: "#e2e8f0", // Slate 200
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const FONT_SIZE = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    huge: 32,
};

export const SHADOWS = {
    sm: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.0,
        elevation: 1,
    },
    md: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
};

// Paleta modo oscuro, usada únicamente por Home (DashboardScreen) y el Drawer.
// El resto de la app sigue usando COLORS (modo claro) sin cambios.
export const DARK = {
    background: "#121212",
    surface: "#1A1A1A",
    card: "#2A2A2A",
    balanceCard: "#0C3B6E",
    accent: "#2E7BF6",
    text: "#FFFFFF",
    textMuted: "#A0A0A0",
    textFaint: "#6B7280",
    income: "#1D9E75",
    expense: "#D85A30",
    border: "#2E2E2E",
    danger: "#E5484D",
};
