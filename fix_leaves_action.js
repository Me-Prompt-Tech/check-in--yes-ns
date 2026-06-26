const fs = require('fs');

let content = fs.readFileSync('app/actions/leaves.ts', 'utf8').replace(/\r\n/g, '\n');

const countAction = `
// 6. Get pending leaves count (Admin only)
export async function getPendingLeavesCountAction() {
  const session = await checkCurrentSession();
  if (!session || session.role !== 'admin') return 0;

  const count = await prisma.leaveRequest.count({
    where: { status: 'pending' }
  });

  return count;
}
`;

content += countAction;

fs.writeFileSync('app/actions/leaves.ts', content);
console.log('Added getPendingLeavesCountAction');
