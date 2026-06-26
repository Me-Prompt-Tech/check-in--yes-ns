'use server';

import prisma from '../lib/db';
import { checkCurrentSession } from './auth';

export interface DBEmployeePrefix {
  id: string;
  prefix: string;
  label: string;
}

// 1. Fetch all prefixes
export async function fetchPrefixesAction(): Promise<DBEmployeePrefix[]> {
  const list = await prisma.employeePrefix.findMany({
    orderBy: { prefix: 'asc' }
  });
  
  return list.map(item => ({
    id: item.id,
    prefix: item.prefix,
    label: item.label
  }));
}

// 2. Create prefix
export async function createPrefixAction(prefix: string, label: string) {
  const session = await checkCurrentSession();
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  if (!prefix || prefix.trim() === '') {
    return { success: false, error: 'รหัสนำหน้าไม่สามารถเว้นว่างได้' };
  }
  
  if (!label || label.trim() === '') {
    return { success: false, error: 'ชื่อเรียกไม่สามารถเว้นว่างได้' };
  }

  const existing = await prisma.employeePrefix.findFirst({
    where: { prefix: prefix.trim().toUpperCase() }
  });

  if (existing) {
    return { success: false, error: 'มีรหัสนำหน้านี้ในระบบแล้ว' };
  }

  await prisma.employeePrefix.create({
    data: {
      prefix: prefix.trim().toUpperCase(),
      label: label.trim()
    }
  });

  return { success: true };
}

// 3. Update prefix
export async function updatePrefixAction(id: string, newPrefix: string, newLabel: string) {
  const session = await checkCurrentSession();
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  if (!newPrefix || newPrefix.trim() === '') {
    return { success: false, error: 'รหัสนำหน้าไม่สามารถเว้นว่างได้' };
  }
  
  if (!newLabel || newLabel.trim() === '') {
    return { success: false, error: 'ชื่อเรียกไม่สามารถเว้นว่างได้' };
  }

  const existing = await prisma.employeePrefix.findFirst({
    where: { 
      prefix: newPrefix.trim().toUpperCase(),
      id: { not: id } 
    }
  });

  if (existing) {
    return { success: false, error: 'มีรหัสนำหน้านี้ในระบบแล้ว' };
  }

  await prisma.employeePrefix.update({
    where: { id },
    data: { 
      prefix: newPrefix.trim().toUpperCase(),
      label: newLabel.trim()
    }
  });

  return { success: true };
}

// 4. Delete prefix
export async function deletePrefixAction(id: string) {
  const session = await checkCurrentSession();
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  await prisma.employeePrefix.delete({
    where: { id }
  });

  return { success: true };
}
