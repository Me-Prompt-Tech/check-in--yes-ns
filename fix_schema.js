const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
schema = schema.replace(
  '  status       String @default("Absent")',
  '  status       String @default("Absent")\n  earlyLeaveReason String?'
);
fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Fixed schema.prisma');
