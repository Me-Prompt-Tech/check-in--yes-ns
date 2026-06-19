'use server';

import prisma from '../lib/db';
import { seedDatabase } from './seed';

export interface DBEmployee {
  id: string;
  firstName: string;
  lastName: string;
  department: 'Engineering' | 'HR' | 'Marketing' | 'Sales' | 'Design';
  role: string;
  username: string;
  status: 'active' | 'suspended';
  createdDate: string;
  forcePasswordChange: boolean;
  roleType?: 'admin' | 'employee';
}

export interface DBAttendanceLog {
  employeeId: string;
  date: string;
  morningIn: string;
  lunchBreak: string;
  afternoonIn: string;
  leaveWork: string;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave' | 'Incomplete';
}

const getTodayLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Calculate overall status based on all punch times
const calculateOverallStatus = (
  morningIn: string,
  lunchBreak: string,
  afternoonIn: string,
  leaveWork: string
): 'Present' | 'Late' | 'Absent' | 'Incomplete' => {
  if (morningIn === '-' && lunchBreak === '-' && afternoonIn === '-' && leaveWork === '-') {
    return 'Absent';
  }
  
  if (morningIn === '-' || lunchBreak === '-' || afternoonIn === '-' || leaveWork === '-') {
    return 'Incomplete';
  }

  // Parse morning check-in to see if it's late (after 09:00 AM)
  const isMorningLate = isTimeLate(morningIn, 9, 0);
  // Parse afternoon check-in to see if it's late (after 02:00 PM / 14:00)
  const isAfternoonLate = isTimeLate(afternoonIn, 14, 0);

  if (isMorningLate || isAfternoonLate) {
    return 'Late';
  }

  return 'Present';
};

const isTimeLate = (timeStr: string, limitHour: number, limitMinute: number): boolean => {
  if (!timeStr || timeStr === '-') return false;
  try {
    const match = timeStr.match(/^(\d+):(\d+)\s+(AM|PM)$/i);
    if (!match) return false;
    let [_, hourStr, minuteStr, ampm] = match;
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;

    return (hour > limitHour) || (hour === limitHour && minute > limitMinute);
  } catch (e) {
    return false;
  }
};

// Ensure database has seed data on any major operations
async function ensureDbSeeded() {
  await seedDatabase();
}

// 1. Fetch Employees
export async function fetchEmployeesAction(): Promise<DBEmployee[]> {
  await ensureDbSeeded();
  const list = await prisma.employee.findMany({
    where: { roleType: { not: 'admin' } },
    orderBy: { id: 'asc' }
  });
    
  return list.map(item => ({
    id: item.id,
    firstName: item.firstName,
    lastName: item.lastName,
    department: item.department,
    role: item.role,
    username: item.username,
    status: item.status,
    createdDate: item.createdDate,
    forcePasswordChange: item.forcePasswordChange
  })) as DBEmployee[];
}

// 2. Create Employee
export async function createEmployeeAction(emp: DBEmployee) {
  await ensureDbSeeded();
  
  const existing = await prisma.employee.findFirst({
    where: {
      OR: [{ id: emp.id }, { username: emp.username }]
    }
  });
  
  if (existing) {
    return { success: false, error: 'รหัสพนักงานหรือ Username นี้มีในระบบแล้ว' };
  }
  
  await prisma.employee.create({
    data: {
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      department: emp.department,
      role: emp.role,
      username: emp.username,
      password: 'password', // Default password
      roleType: 'employee',
      status: emp.status,
      createdDate: emp.createdDate,
      forcePasswordChange: emp.forcePasswordChange
    }
  });
  
  return { success: true };
}

// 3. Update Employee
export async function updateEmployeeAction(emp: DBEmployee) {
  await ensureDbSeeded();
  
  await prisma.employee.update({
    where: { id: emp.id },
    data: {
      firstName: emp.firstName,
      lastName: emp.lastName,
      department: emp.department,
      role: emp.role,
      username: emp.username,
      status: emp.status
    }
  });
  
  return { success: true };
}

// 4. Reset Password
export async function resetPasswordAction(empId: string, newPass: string, forceReset: boolean) {
  await ensureDbSeeded();
  
  await prisma.employee.update({
    where: { id: empId },
    data: {
      password: newPass,
      forcePasswordChange: forceReset
    }
  });
  
  return { success: true };
}

// 5. Delete Employee
export async function deleteEmployeeAction(empId: string) {
  await ensureDbSeeded();
  
  await prisma.employee.delete({ where: { id: empId } });
  // Clean up their attendance logs too
  await prisma.attendance.deleteMany({ where: { employeeId: empId } });
  
  return { success: true };
}

// 6. Fetch Today's Attendance logs for Dashboard
export async function fetchAttendanceTodayAction() {
  await ensureDbSeeded();
  const today = getTodayLocalDate();
  
  // Get all active employees
  const activeEmployees = await prisma.employee.findMany({
    where: { roleType: { not: 'admin' }, status: 'active' }
  });
    
  // Get all attendance logs for today
  const logs = await prisma.attendance.findMany({
    where: { date: today }
  });
    
  const logsMap = new Map(logs.map(log => [log.employeeId, log]));
  
  // Combine lists
  const COLOR_OPTIONS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-violet-500', 'bg-rose-500', 'bg-sky-500', 'bg-teal-500'];
  
  return activeEmployees.map((emp, index) => {
    const log = logsMap.get(emp.id);
    return {
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      role: emp.role,
      department: emp.department,
      morningIn: log ? log.morningIn : '-',
      lunchBreak: log ? log.lunchBreak : '-',
      afternoonIn: log ? log.afternoonIn : '-',
      leaveWork: log ? log.leaveWork : '-',
      status: log ? log.status : 'Absent',
      avatarColor: COLOR_OPTIONS[index % COLOR_OPTIONS.length]
    };
  });
}

// 7. Get Employee attendance logs (last 7 days or all logs for this employee)
export async function fetchEmployeeLogsAction(empId: string) {
  await ensureDbSeeded();
  
  const list = await prisma.attendance.findMany({
    where: { employeeId: empId },
    orderBy: { date: 'desc' },
    take: 10
  });
    
  const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  
  return list.map(item => {
    const parts = item.date.split('-');
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const dayName = dayNames[dateObj.getDay()];
    
    // Convert date format to Thai format (e.g. 19 มิ.ย. 2026)
    const monthsThai = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const thaiFormattedDate = `${dateObj.getDate()} ${monthsThai[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    
    // Check-in / check-out representation for the employee's weekly table
    // (We use morningIn as the main Check-in and leaveWork as the main Check-out)
    return {
      date: thaiFormattedDate,
      day: dayName,
      checkIn: item.morningIn,
      checkOut: item.leaveWork,
      status: item.status === 'Present' ? 'Normal' : item.status === 'Incomplete' ? 'Pending' : item.status
    };
  });
}

// 8. Fetch Today's log for specific Employee
export async function fetchEmployeeLogTodayAction(empId: string) {
  await ensureDbSeeded();
  const today = getTodayLocalDate();
  
  const log = await prisma.attendance.findUnique({
    where: { id: `${empId}_${today}` }
  });
  
  if (!log) {
    return {
      isCheckedIn: false,
      isCheckedOut: false,
      checkInTime: '-',
      checkOutTime: '-'
    };
  }
  
  return {
    isCheckedIn: log.morningIn !== '-',
    isCheckedOut: log.leaveWork !== '-',
    checkInTime: log.morningIn,
    checkOutTime: log.leaveWork
  };
}

// 9. Punch In/Out Operation from Employee page
export async function punchAttendanceAction(empId: string, type: 'morning' | 'lunch' | 'afternoon' | 'leave') {
  await ensureDbSeeded();
  const today = getTodayLocalDate();
  
  const now = new Date();
  const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  const existingLog = await prisma.attendance.findUnique({
    where: { id: `${empId}_${today}` }
  });
  
  let morningIn = '-';
  let lunchBreak = '-';
  let afternoonIn = '-';
  let leaveWork = '-';
  
  if (existingLog) {
    morningIn = existingLog.morningIn;
    lunchBreak = existingLog.lunchBreak;
    afternoonIn = existingLog.afternoonIn;
    leaveWork = existingLog.leaveWork;
  }
  
  if (type === 'morning') morningIn = formattedTime;
  if (type === 'lunch') lunchBreak = formattedTime;
  if (type === 'afternoon') afternoonIn = formattedTime;
  if (type === 'leave') leaveWork = formattedTime;
  
  const status = calculateOverallStatus(morningIn, lunchBreak, afternoonIn, leaveWork);
  
  await prisma.attendance.upsert({
    where: { id: `${empId}_${today}` },
    update: {
      morningIn,
      lunchBreak,
      afternoonIn,
      leaveWork,
      status
    },
    create: {
      id: `${empId}_${today}`,
      employeeId: empId,
      date: today,
      morningIn,
      lunchBreak,
      afternoonIn,
      leaveWork,
      status
    }
  });
  
  return { success: true, formattedTime };
}
