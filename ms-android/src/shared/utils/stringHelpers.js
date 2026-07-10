export const getInitials = (name) => {
    const parts = (name || 'Usuario').trim().split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
    return initials || 'U';
};
