import '../configs/db.js';
import { User } from '../src/user/user.model.js';
import { Account } from '../src/account/account.model.js';

const email = process.argv[2];
if(!email){
  console.error('Usage: node scripts/queryUserAccounts.mjs <email>');
  process.exit(1);
}

(async ()=>{
  const user = await User.findOne({ where: { email } });
  if(!user){
    console.log(JSON.stringify({ found: false }));
    process.exit(0);
  }
  const accounts = await Account.findAll({ where: { userId: user.id }, order: [['openedAt','DESC']] });
  console.log(JSON.stringify({ found: true, userId: user.id, email: user.email, accounts: accounts.map(a=>({ id: a.id, accountNumber: a.accountNumber, accountStatus: a.accountStatus, status: !!a.status, openedAt: a.openedAt })) }, null, 2));
  process.exit(0);
})().catch(err=>{ console.error('ERROR', err); process.exit(1); });
