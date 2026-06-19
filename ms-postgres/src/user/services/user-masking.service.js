const maskEmail = (email) => {
    if (!email || typeof email !== 'string') return email;
    const [localPart = '', domainPart = ''] = email.split('@');
    if (!domainPart) return '***';

    const safeLocal = localPart.length <= 2
        ? `${localPart.charAt(0) || '*'}***`
        : `${localPart.slice(0, 2)}***`;

    const [domainName = '', domainTld = ''] = domainPart.split('.');
    const safeDomain = domainName ? `${domainName.charAt(0)}***` : '***';

    return `${safeLocal}@${safeDomain}${domainTld ? `.${domainTld}` : ''}`;
};

const maskDocumentNumber = (documentNumber) => {
    if (!documentNumber || typeof documentNumber !== 'string') return documentNumber;
    const cleanValue = documentNumber.replace(/\s+/g, '');
    if (cleanValue.length <= 4) return '****';
    return `${'*'.repeat(Math.max(0, cleanValue.length - 4))}${cleanValue.slice(-4)}`;
};

const maskPhoneNumber = (phoneNumber) => {
    if (!phoneNumber || typeof phoneNumber !== 'string') return phoneNumber;
    const cleanValue = phoneNumber.replace(/\D/g, '');
    if (cleanValue.length <= 3) return '***';
    return `${'*'.repeat(Math.max(0, cleanValue.length - 3))}${cleanValue.slice(-3)}`;
};

const maskAddress = (address) => {
    if (!address || typeof address !== 'string') return address;
    const trimmedAddress = address.trim();
    if (trimmedAddress.length <= 6) return '***';
    return `${trimmedAddress.slice(0, 6)}***`;
};

const maskProfileForAdminView = (profile) => {
    if (!profile) return profile;

    return {
        ...profile,
        PhoneNumber: maskPhoneNumber(profile.PhoneNumber),
        Address: maskAddress(profile.Address),
        DocumentNumber: maskDocumentNumber(profile.DocumentNumber),
        Income: profile.Income !== null && profile.Income !== undefined ? 'CONFIDENCIAL' : profile.Income
    };
};

const maskProfileForEmployeeView = (profile) => {
    if (!profile) return profile;

    return {
        ...profile,
        PhoneNumber: maskPhoneNumber(profile.PhoneNumber),
        DocumentNumber: maskDocumentNumber(profile.DocumentNumber),
        Income: profile.Income !== null && profile.Income !== undefined ? 'RESTRINGIDO' : profile.Income
    };
};

const maskProfileForClientView = (profile) => {
    if (!profile) return profile;

    return {
        ...profile,
        PhoneNumber: maskPhoneNumber(profile.PhoneNumber),
        Address: maskAddress(profile.Address),
        DocumentNumber: maskDocumentNumber(profile.DocumentNumber),
        Income: '***'
    };
};

const maskEmailCollection = (items) => {
    if (!Array.isArray(items)) return items;
    return items.map((item) => ({
        ...item,
        email: maskEmail(item.email)
    }));
};

const applyAdminExposureRules = (userData) => {
    if (!userData) return userData;
    const plainUser = typeof userData.toJSON === 'function' ? userData.toJSON() : { ...userData };

    return {
        ...plainUser,
        email: maskEmail(plainUser.email),
        UserProfile: maskProfileForAdminView(plainUser.UserProfile),
        profile: maskProfileForAdminView(plainUser.profile),
        UserEmails: maskEmailCollection(plainUser.UserEmails),
        userEmails: maskEmailCollection(plainUser.userEmails)
    };
};

const applyEmployeeExposureRules = (userData) => {
    if (!userData) return userData;
    const plainUser = typeof userData.toJSON === 'function' ? userData.toJSON() : { ...userData };

    return {
        ...plainUser,
        UserProfile: maskProfileForEmployeeView(plainUser.UserProfile),
        profile: maskProfileForEmployeeView(plainUser.profile)
    };
};

const applyClientExposureRules = (userData, accessorUserId) => {
    if (!userData) return userData;
    const plainUser = typeof userData.toJSON === 'function' ? userData.toJSON() : { ...userData };

    if (plainUser.id === accessorUserId) {
        return plainUser;
    }

    return {
        ...plainUser,
        email: maskEmail(plainUser.email),
        UserProfile: maskProfileForClientView(plainUser.UserProfile),
        profile: maskProfileForClientView(plainUser.profile),
        UserEmails: maskEmailCollection(plainUser.UserEmails),
        userEmails: maskEmailCollection(plainUser.userEmails)
    };
};

const applyExposureRulesByRole = (userData, accessorRole, accessorUserId = null) => {
    if (!userData) return userData;
    const normalizedRole = String(accessorRole || '').trim();

    if (normalizedRole === 'Admin') return applyAdminExposureRules(userData);
    if (normalizedRole === 'Employee') return applyEmployeeExposureRules(userData);
    if (normalizedRole === 'Client') return applyClientExposureRules(userData, accessorUserId);

    return applyAdminExposureRules(userData);
};

export {
    maskEmail,
    maskDocumentNumber,
    maskPhoneNumber,
    maskAddress,
    applyAdminExposureRules,
    applyEmployeeExposureRules,
    applyClientExposureRules,
    applyExposureRulesByRole
};
