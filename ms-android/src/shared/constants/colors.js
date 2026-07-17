// Paleta de marca NexusBank: azul marino + dorado + blanco/marfil.
// Sin negro ni grises neutros — lo "oscuro" siempre es marino, lo "gris" siempre
// tiene tinte azulado (slate), para que todo se sienta de la misma familia de color.
// Se reutiliza en todas las vistas (Login, Dashboard, Cuentas, Transferencias, etc.)
// y se combina con SPACING/FONT_SIZE/SHADOWS de theme.js.
export const PALETTE = {
    // Marino — escala completa, de más oscuro a más claro.
    // navy500 es "el" marino de marca (botones, links, headers).
    navy900: '#050F22',
    navy700: '#0C2245',
    navy500: '#123A6B',
    navy300: '#2F5C96',
    navy100: '#6B8FC4',

    // Dorado — acentos, badges, detalles premium. Nunca como fondo grande.
    gold700: '#8C6D1F',
    gold500: '#C9A227',
    gold300: '#E4C77A',
    gold100: '#F3E4B8',

    // Blanco / marfil cálido — fondos y superficies claras.
    white: '#FFFFFF',
    ivory: '#F8F5EE',
    pearl: '#EFEAE0',

    // Slate — gris con tinte azul marino, para texto/bordes (nunca gris neutro).
    slate700: '#3E4C63',
    slate500: '#66748C',
    slate300: '#A8B3C4',
    slate100: '#DCE1EA',

    // Semánticos
    success: '#1F9D6C',
    error: '#C1443A',
};

// Tema claro (ya no se usa en ninguna vista activa — se deja como referencia
// para un futuro modo claro). Mismas claves que BANK_DARK para poder alternar.
export const BANK_LIGHT = {
    background: PALETTE.ivory,
    surface: PALETTE.white,
    card: PALETTE.white,
    balanceCard: PALETTE.navy500,
    primary: PALETTE.navy500,
    primaryDark: PALETTE.navy700,
    onPrimary: PALETTE.white,
    accent: PALETTE.gold500,
    accentLight: PALETTE.gold300,
    text: PALETTE.navy900,
    textMuted: PALETTE.slate500,
    textFaint: PALETTE.slate500,
    border: PALETTE.slate100,
    success: PALETTE.success,
    income: PALETTE.success,
    error: PALETTE.error,
    danger: PALETTE.error,
    warning: PALETTE.gold500,
    expense: '#D8703A',
};

// Tema oscuro — usado en TODA la app (Dashboard, Drawer, Login, Cuentas,
// Depósitos, Transferencias, Historial, Reversiones, Favoritos, Promociones).
// Elevación: background (marino más oscuro) < surface < card < balanceCard (la más viva).
// primary/onPrimary son para botones y elementos "sólidos" (navy300 resalta
// sobre el fondo oscuro; texto blanco encima para buen contraste).
export const BANK_DARK = {
    background: PALETTE.navy900,
    surface: PALETTE.navy700,
    card: PALETTE.navy500,
    balanceCard: PALETTE.navy300,
    primary: PALETTE.navy300,
    primaryDark: PALETTE.navy500,
    onPrimary: PALETTE.white,
    accent: PALETTE.gold500,
    accentLight: PALETTE.gold300,
    text: PALETTE.white,
    textMuted: PALETTE.slate300,
    textFaint: PALETTE.slate500,
    success: PALETTE.success,
    income: PALETTE.success,
    error: PALETTE.error,
    danger: PALETTE.error,
    warning: PALETTE.gold500,
    expense: '#E08858',
    border: PALETTE.slate700,
};
