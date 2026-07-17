// Un cliente nunca ve APERTURA_CUENTA_BONUS en el listado (mismo filtro que
// Bancario-NexusBank/src/features/client/pages/Promotions.jsx).
export const filterVisiblePromotions = (promotions = []) =>
    promotions.filter((promo) => promo.promotionType !== 'APERTURA_CUENTA_BONUS');

export const getPromotionTypeLabel = (type) =>
    String(type || '').replace(/_/g, ' ');

export const formatPromotionDate = (dateString) => {
    if (!dateString) return 'Indefinida';
    return new Date(dateString).toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

// Misma prioridad que la web: cashback % > cashback fijo > descuento > genérico.
export const getPromotionBenefitText = (promo) => {
    if (promo.cashbackPercentage) return `${promo.cashbackPercentage}% de cashback`;
    if (promo.cashbackAmount) return `Q${parseFloat(promo.cashbackAmount).toFixed(2)} de cashback`;
    if (promo.discountPercentage) return `${promo.discountPercentage}% de descuento`;
    return 'Recompensa especial';
};

const PROMOTION_INSTRUCTIONS = {
    PRIMER_DEPOSITO_BONUS:
        'Realiza tu primer depósito y recibe un porcentaje de vuelta (cashback) automáticamente en tu cuenta principal.',
    TRANSFERENCIA_RECIBIDA_BONUS:
        'Recibe una transferencia de otra persona y recibe un porcentaje extra o un bono directamente acreditado a tu balance.',
};

export const getPromotionInstructions = (type) =>
    PROMOTION_INSTRUCTIONS[type] || 'Aprovecha esta promoción desde tu panel interactivo para obtener sus beneficios.';
