'use server';

import prisma from '../lib/db';

export async function seedDatabase() {
  try {
    // Check if employees collection has data
    const employeesCount = await prisma.employee.count();
    
    if (employeesCount === 0) {
      console.log('Seeding employees database...');
      
      const defaultEmployees = [
        // Admin
        {
          id: 'ADM001',
          firstName: 'Admin',
          lastName: 'System',
          role: 'System Administrator',
          department: 'HR',
          username: 'admin',
          password: 'password',
          roleType: 'admin',
          status: 'active',
          createdDate: '2026-06-19',
          forcePasswordChange: false
        },
        // Employees
        {
          id: 'EMP001',
          firstName: 'สมชาย',
          lastName: 'รักดี',
          role: 'Frontend Developer',
          department: 'Engineering',
          username: 'somchai.r',
          password: 'password',
          roleType: 'employee',
          status: 'active',
          createdDate: '2026-01-10',
          forcePasswordChange: false
        },
        {
          id: 'EMP002',
          firstName: 'วิภาดา',
          lastName: 'รุ่งเรือง',
          role: 'HR Manager',
          department: 'HR',
          username: 'wiphada.r',
          password: 'password',
          roleType: 'employee',
          status: 'active',
          createdDate: '2026-02-15',
          forcePasswordChange: false
        },
        {
          id: 'EMP003',
          firstName: 'อนันต์',
          lastName: 'ทรงคุณ',
          role: 'UI/UX Designer',
          department: 'Design',
          username: 'anant.s',
          password: 'password',
          roleType: 'employee',
          status: 'active',
          createdDate: '2026-03-01',
          forcePasswordChange: true
        },
        {
          id: 'EMP004',
          firstName: 'เกศรา',
          lastName: 'คำใส',
          role: 'Marketing Specialist',
          department: 'Marketing',
          username: 'ketsara.k',
          password: 'password',
          roleType: 'employee',
          status: 'active',
          createdDate: '2026-03-12',
          forcePasswordChange: false
        },
        {
          id: 'EMP005',
          firstName: 'ประพันธ์',
          lastName: 'ดำรง',
          role: 'Backend Developer',
          department: 'Engineering',
          username: 'praphan.d',
          password: 'password',
          roleType: 'employee',
          status: 'suspended',
          createdDate: '2026-04-18',
          forcePasswordChange: false
        },
        {
          id: 'EMP006',
          firstName: 'ธนพล',
          lastName: 'มณีรัตน์',
          role: 'Sales Executive',
          department: 'Sales',
          username: 'thanapol.m',
          password: 'password',
          roleType: 'employee',
          status: 'active',
          createdDate: '2026-05-02',
          forcePasswordChange: false
        },
        {
          id: 'EMP007',
          firstName: 'รพีพรรณ',
          lastName: 'โสภา',
          role: 'HR Officer',
          department: 'HR',
          username: 'rapeepan.s',
          password: 'password',
          roleType: 'employee',
          status: 'active',
          createdDate: '2026-05-15',
          forcePasswordChange: false
        },
        {
          id: 'EMP008',
          firstName: 'ณัฐวุฒิ',
          lastName: 'มีสุข',
          role: 'System Admin',
          department: 'Engineering',
          username: 'nattawut.m',
          password: 'password',
          roleType: 'employee',
          status: 'active',
          createdDate: '2026-05-20',
          forcePasswordChange: false
        },
        {
          id: 'EMP099',
          firstName: 'คุณพนักงาน',
          lastName: 'ทดสอบ',
          role: 'Employee Tester',
          department: 'Engineering',
          username: 'employee',
          password: 'password',
          roleType: 'employee',
          status: 'active',
          createdDate: '2026-06-19',
          forcePasswordChange: false
        }
      ];

      await prisma.employee.createMany({ data: defaultEmployees });
      console.log('Successfully seeded employees.');
    }

    // Check if attendance collection has data for today (2026-06-19)
    const today = '2026-06-19';
    const attendanceCount = await prisma.attendance.count({ where: { date: today } });
    
    if (attendanceCount === 0) {
      console.log('Seeding today\'s attendance logs...');
      const defaultAttendance = [
        {
          id: `EMP001_${today}`,
          employeeId: 'EMP001',
          date: today,
          morningIn: '08:15 AM',
          lunchBreak: '12:02 PM',
          afternoonIn: '01:00 PM',
          leaveWork: '05:00 PM',
          status: 'Present'
        },
        {
          id: `EMP002_${today}`,
          employeeId: 'EMP002',
          date: today,
          morningIn: '08:28 AM',
          lunchBreak: '12:05 PM',
          afternoonIn: '01:05 PM',
          leaveWork: '05:15 PM',
          status: 'Present'
        },
        {
          id: `EMP003_${today}`,
          employeeId: 'EMP003',
          date: today,
          morningIn: '08:45 AM',
          lunchBreak: '12:10 PM',
          afternoonIn: '01:15 PM',
          leaveWork: '05:30 PM',
          status: 'Late'
        },
        {
          id: `EMP004_${today}`,
          employeeId: 'EMP004',
          date: today,
          morningIn: '08:20 AM',
          lunchBreak: '12:01 PM',
          afternoonIn: '01:02 PM',
          leaveWork: '05:00 PM',
          status: 'Present'
        },
        {
          id: `EMP005_${today}`,
          employeeId: 'EMP005',
          date: today,
          morningIn: '08:05 AM',
          lunchBreak: '11:58 AM',
          afternoonIn: '12:58 PM',
          leaveWork: '05:00 PM',
          status: 'Present'
        },
        {
          id: `EMP006_${today}`,
          employeeId: 'EMP006',
          date: today,
          morningIn: '-',
          lunchBreak: '-',
          afternoonIn: '-',
          leaveWork: '-',
          status: 'Absent'
        },
        {
          id: `EMP007_${today}`,
          employeeId: 'EMP007',
          date: today,
          morningIn: '-',
          lunchBreak: '-',
          afternoonIn: '-',
          leaveWork: '-',
          status: 'On Leave'
        },
        {
          id: `EMP008_${today}`,
          employeeId: 'EMP008',
          date: today,
          morningIn: '08:55 AM',
          lunchBreak: '12:15 PM',
          afternoonIn: '01:25 PM',
          leaveWork: '06:00 PM',
          status: 'Late'
        }
      ];
      
      await prisma.attendance.createMany({ data: defaultAttendance });
      console.log('Successfully seeded today\'s attendance logs.');
    }
  } catch (err) {
    console.error('Failed to seed database:', err);
  }
}
