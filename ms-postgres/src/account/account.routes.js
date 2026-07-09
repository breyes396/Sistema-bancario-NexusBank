import express from 'express';
import {
  createAccount,
  requestAccountWithoutToken,
  requestAccountWithToken,
  enableRequestedAccount,
  rejectRequestedAccount,
  approveAccountRequest,
  rejectAccountRequest,
  listAccounts,
  updateAccountLimits,
  convertAccountBalance,
  getAccountLimitsAdmin,
  updateAccountLimitsAdmin,
  getAdminAccountDetails,
  freezeAccount,
  unfreezeAccount,
  getAccountBlockHistory
} from './account.controller.js';
import { AccountRequest } from './accountRequest.model.js';
import { User, UserProfile } from '../user/user.model.js';
import { verifyTokenAndGetUser, verifyRoles } from '../../middlewares/role-middleware.js';
import { validateAccountType } from '../../middlewares/account-validators.js';


const router = express.Router();

router.post('/public/account-requests', validateAccountType, requestAccountWithoutToken);

router.post('/accounts/requests', verifyTokenAndGetUser, verifyRoles(['Client']), validateAccountType, requestAccountWithToken);

router.get('/admin/account-requests', verifyTokenAndGetUser, verifyRoles(['Admin']), async (req, res) => {
  try {
    const requests = await AccountRequest.findAll({ 
      where: { status: 'PENDING' }, 
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'email'],
          include: [
            {
              model: UserProfile,
              as: 'UserProfile',
              attributes: ['Name', 'Username', 'PhoneNumber', 'DocumentNumber', 'JobName', 'Income']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']] 
    });
    return res.status(200).json({ success: true, data: requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
});

router.get('/admin/account-requests/all', verifyTokenAndGetUser, verifyRoles(['Admin']), async (req, res) => {
  try {
    const requests = await AccountRequest.findAll({ 
      order: [['createdAt', 'DESC']] 
    });
    return res.status(200).json({ success: true, data: requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
});

router.post('/admin/account-requests/:id/approve', verifyTokenAndGetUser, verifyRoles(['Admin']), approveAccountRequest);

router.post('/admin/account-requests/:id/reject', verifyTokenAndGetUser, verifyRoles(['Admin']), rejectAccountRequest);

router.get('/accounts', verifyTokenAndGetUser, verifyRoles(['Client', 'Employee', 'Admin']), listAccounts);

router.post('/accounts', verifyTokenAndGetUser, verifyRoles(['Admin']), validateAccountType, createAccount);

router.post('/admin/accounts/:id/enable', verifyTokenAndGetUser, verifyRoles(['Admin']), enableRequestedAccount);

router.post('/admin/accounts/:id/reject', verifyTokenAndGetUser, verifyRoles(['Admin']), rejectRequestedAccount);

router.put('/accounts/:id/limits', verifyTokenAndGetUser, verifyRoles(['Employee', 'Admin']), updateAccountLimits);

router.get('/accounts/:id/limits/admin', verifyTokenAndGetUser, verifyRoles(['Admin']), getAccountLimitsAdmin);

router.put('/accounts/:id/limits/admin', verifyTokenAndGetUser, verifyRoles(['Admin']), updateAccountLimitsAdmin);

router.get('/admin/accounts/:accountId/details', verifyTokenAndGetUser, verifyRoles(['Admin']), getAdminAccountDetails);

router.get('/my-account/balance/convert', verifyTokenAndGetUser, verifyRoles(['Client']), convertAccountBalance);

router.post('/admin/accounts/:id/freeze',
  verifyTokenAndGetUser,
  verifyRoles(['Admin']),
  freezeAccount
);

router.post('/admin/accounts/:id/unfreeze',
  verifyTokenAndGetUser,
  verifyRoles(['Admin']),
  unfreezeAccount
);

router.get('/admin/accounts/:id/block-history',
  verifyTokenAndGetUser,
  verifyRoles(['Admin']),
  getAccountBlockHistory
);

export default router;
