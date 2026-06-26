const fs = require('fs');

let content = fs.readFileSync('app/actions/employees.ts', 'utf8').replace(/\r\n/g, '\n');

// 1. Update DBAttendanceLog
content = content.replace(
  "  status: 'Present' | 'Late' | 'Absent' | 'On Leave' | 'Incomplete';\n}",
  "  status: 'Present' | 'Late' | 'Absent' | 'On Leave' | 'Incomplete';\n  earlyLeaveReason?: string | null;\n}"
);

// 2. Update punchAttendanceAction signature
content = content.replace(
  "export async function punchAttendanceAction(empId: string, type: 'morning' | 'lunch' | 'afternoon' | 'leave') {",
  "export async function punchAttendanceAction(empId: string, type: 'morning' | 'lunch' | 'afternoon' | 'leave', earlyLeaveReason?: string) {"
);

// 3. Update the upsert block inside punchAttendanceAction
const upsertFrom = `  await prisma.attendance.upsert({
    where: { id: \`\${empId}_\${today}\` },
    update: {
      morningIn,
      lunchBreak,
      afternoonIn,
      leaveWork,
      status
    },
    create: {
      id: \`\${empId}_\${today}\`,
      employeeId: empId,
      date: today,
      morningIn,
      lunchBreak,
      afternoonIn,
      leaveWork,
      status
    }
  });`;

const upsertTo = `  const updateData: any = {
    morningIn,
    lunchBreak,
    afternoonIn,
    leaveWork,
    status
  };
  
  if (type === 'leave' && earlyLeaveReason) {
    updateData.earlyLeaveReason = earlyLeaveReason;
  }

  await prisma.attendance.upsert({
    where: { id: \`\${empId}_\${today}\` },
    update: updateData,
    create: {
      id: \`\${empId}_\${today}\`,
      employeeId: empId,
      date: today,
      morningIn,
      lunchBreak,
      afternoonIn,
      leaveWork,
      status,
      earlyLeaveReason: (type === 'leave' && earlyLeaveReason) ? earlyLeaveReason : null
    }
  });`;

content = content.replace(upsertFrom, upsertTo);

fs.writeFileSync('app/actions/employees.ts', content);
console.log('Fixed app/actions/employees.ts');
