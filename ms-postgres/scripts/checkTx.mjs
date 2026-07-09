import '../configs/db.js';
import { Transaction } from '../src/transaction/transaction.model.js';

const id = process.argv[2];
if(!id){
  console.error('Usage: node scripts/checkTx.mjs <id>');
  process.exit(1);
}

(async ()=>{
  const tx = await Transaction.findByPk(id);
  if(!tx){
    console.log(JSON.stringify({ found: false, id }));
  } else {
    console.log(JSON.stringify({ found: true, id: tx.id, type: tx.type, status: tx.status, accountId: tx.accountId }, null, 2));
  }
  process.exit(0);
})().catch(err=>{ console.error('ERROR', err); process.exit(1); });
