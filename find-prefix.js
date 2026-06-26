const fs = require('fs');
const lines = fs.readFileSync('app/admin/departments/page.tsx', 'utf8').split('\n');
lines.forEach((line, i) => {
  if (line.includes('Prefix') || line.includes('formLabel') || line.includes('จัดการรหัสนำหน้า')) {
    console.log(`${i+1}: ${line.trim()}`);
  }
});
