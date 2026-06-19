'use server';

import prisma from '../lib/db';
import { checkCurrentSession } from './auth';

export interface DBLeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'sick' | 'personal' | 'vacation';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string | null;
  medicalCertFileData?: string | null;
  medicalCertFileName?: string | null;
  createdAt: string;
}

// 1. Submit a new leave request (Employee)
export async function submitLeaveRequestAction(data: {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  medicalCertFileData?: string;
  medicalCertFileName?: string;
}) {
  const session = await checkCurrentSession();
  if (!session || session.role !== 'employee') {
    return { success: false, error: 'Unauthorized' };
  }

  if (!data.leaveType || !data.startDate || !data.endDate || !data.reason.trim()) {
    return { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' };
  }

  if (new Date(data.startDate) > new Date(data.endDate)) {
    return { success: false, error: 'วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด' };
  }

  // Get employee name
  const employee = await prisma.employee.findUnique({
    where: { id: session.userId }
  });
  if (!employee) {
    return { success: false, error: 'ไม่พบข้อมูลพนักงาน' };
  }

  const now = new Date();
  const createdAt = now.toISOString();

  await prisma.leaveRequest.create({
    data: {
      employeeId: session.userId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason.trim(),
      status: 'pending',
      medicalCertFileData: data.medicalCertFileData || null,
      medicalCertFileName: data.medicalCertFileName || null,
      createdAt,
    }
  });

  return { success: true };
}

// 2. Fetch leave requests for current employee
export async function fetchMyLeaveRequestsAction(): Promise<DBLeaveRequest[]> {
  const session = await checkCurrentSession();
  if (!session || session.role !== 'employee') return [];

  const list = await prisma.leaveRequest.findMany({
    where: { employeeId: session.userId },
    orderBy: { createdAt: 'desc' }
  });

  return list.map((item: any) => ({
    id: item.id,
    employeeId: item.employeeId,
    employeeName: item.employeeName,
    leaveType: item.leaveType,
    startDate: item.startDate,
    endDate: item.endDate,
    reason: item.reason,
    status: item.status,
    adminNote: item.adminNote,
    medicalCertFileData: item.medicalCertFileData,
    medicalCertFileName: item.medicalCertFileName,
    createdAt: item.createdAt,
  })) as DBLeaveRequest[];
}

// 3. Fetch ALL leave requests (Admin only)
export async function fetchAllLeaveRequestsAction(): Promise<DBLeaveRequest[]> {
  const session = await checkCurrentSession();
  if (!session || session.role !== 'admin') return [];

  const list = await prisma.leaveRequest.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return list.map((item: any) => ({
    id: item.id,
    employeeId: item.employeeId,
    employeeName: item.employeeName,
    leaveType: item.leaveType,
    startDate: item.startDate,
    endDate: item.endDate,
    reason: item.reason,
    status: item.status,
    adminNote: item.adminNote,
    medicalCertFileData: item.medicalCertFileData,
    medicalCertFileName: item.medicalCertFileName,
    createdAt: item.createdAt,
  })) as DBLeaveRequest[];
}

// 4. Approve or Reject a leave request (Admin only)
export async function updateLeaveStatusAction(
  id: string,
  status: 'approved' | 'rejected',
  adminNote?: string
) {
  const session = await checkCurrentSession();
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  await prisma.leaveRequest.update({
    where: { id },
    data: {
      status,
      adminNote: adminNote?.trim() || null,
    }
  });

  return { success: true };
}

// 5. Delete a leave request (Employee can cancel a pending request)
export async function deleteLeaveRequestAction(id: string) {
  const session = await checkCurrentSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const req = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!req) return { success: false, error: 'ไม่พบข้อมูล' };

  // Employee can only delete their own pending requests
  if (session.role === 'employee') {
    if (req.employeeId !== session.userId) {
      return { success: false, error: 'ไม่มีสิทธิ์ลบคำขอของผู้อื่น' };
    }
    if (req.status !== 'pending') {
      return { success: false, error: 'ไม่สามารถยกเลิกคำขอที่ถูกดำเนินการแล้ว' };
    }
  }

  await prisma.leaveRequest.delete({ where: { id } });
  return { success: true };
}
