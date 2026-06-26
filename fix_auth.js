const fs = require('fs');

let content = fs.readFileSync('app/actions/auth.ts', 'utf8');

const newAction = `
export async function resetPasswordAction(username: string, employeeId: string) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { username }
    });

    if (!employee || employee.id !== employeeId) {
      return { success: false, error: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบชื่อผู้ใช้หรือรหัสพนักงานอีกครั้ง' };
    }

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        password: 'password123',
        forcePasswordChange: true
      }
    });

    return { success: true };
  } catch (err) {
    console.error('Reset password database query error:', err);
    return { success: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล' };
  }
}
`;

fs.appendFileSync('app/actions/auth.ts', newAction);
console.log('Added resetPasswordAction to auth.ts');
