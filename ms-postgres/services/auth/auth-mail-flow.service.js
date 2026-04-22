import { sendPasswordResetEmail, sendVerificationEmail } from '../../helpers/mailer.js';

export const sendVerificationFlowEmail = async ({ email, profileName, verificationToken }) => {
    return sendVerificationEmail(email, profileName, verificationToken);
};

export const sendPasswordResetFlowEmail = async ({ email, token }) => {
    return sendPasswordResetEmail(email, token);
};
