'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { checkCurrentSession, logoutAction } from '../../actions/auth';
import { fetchEmployeesAction, deleteEmployeeAction, createEmployeeAction, updateEmployeeAction } from '../../actions/employees';
import { ThemeToggle } from '../../components/ThemeToggle';
import { fetchDepartmentsAction, DBDepartment } from '../../actions/departments';
import { fetchPrefixesAction, DBEmployeePrefix } from '../../actions/prefixes';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  department: 'Engineering' | 'HR' | 'Marketing' | 'Sales' | 'Design';
  role: string;
  username: string;
  status: 'active' | 'suspended'; // ใช้งาน / ระงับ
  createdDate: string;
  forcePasswordChange: boolean;
  roleType?: 'admin' | 'employee';
}

export default function EmployeeManagement() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [authLoading, setAuthLoading] = useState(true);
  
  // Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptOptions, setDeptOptions] = useState<DBDepartment[]>([]);
  const [prefixes, setPrefixes] = useState<DBEmployeePrefix[]>([]);
  const [formEmpPrefix, setFormEmpPrefix] = useState('EMP');

  // Modal States
  const [activeModal, setActiveModal] = useState<'none' | 'add' | 'edit' | 'view' | 'reset-password' | 'delete'>('none');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form Fields State
  const [formId, setFormId] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formDepartment, setFormDepartment] = useState<'Engineering' | 'HR' | 'Marketing' | 'Sales' | 'Design'>('Engineering');
  const [formRole, setFormRole] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'suspended'>('active');
  const [formRoleType, setFormRoleType] = useState<'admin' | 'employee'>('employee');
  const [formForceReset, setFormForceReset] = useState(true);
  const [validationError, setValidationError] = useState('');

  // ----------------------------------------------------
  // SERVER ACTION CALLS (MongoDB via Prisma)
  // ----------------------------------------------------

  // 1. Fetch Employees
  const fetchEmployees = async () => {
    try {
      const data = await fetchEmployeesAction();
      setEmployees(data as Employee[]);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  // 2. Create Employee
  const createEmployee = async (newEmp: Employee) => {
    try {
      const result = await createEmployeeAction(newEmp as any);
      if (result.success) {
        await fetchEmployees();
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (err) {
      console.error('Error creating employee:', err);
      return { success: false, error: 'ไม่สามารถสร้างบัญชีพนักงานได้' };
    }
  };

  // 3. Update Employee
  const updateEmployee = async (updatedEmp: Employee) => {
    try {
      await updateEmployeeAction(updatedEmp as any);
      await fetchEmployees();
      return { success: true };
    } catch (err) {
      console.error('Error updating employee:', err);
      return { success: false, error: 'ไม่สามารถอัปเดตข้อมูลพนักงานได้' };
    }
  };

  // 4. Reset Password
  const resetPassword = async (empId: string, newPass: string, forceReset: boolean) => {
    try {
      const { resetPasswordAction } = await import('../../actions/employees');
      await resetPasswordAction(empId, newPass, forceReset);
      await fetchEmployees();
      return { success: true };
    } catch (err) {
      console.error('Error resetting password:', err);
      return { success: false, error: 'ไม่สามารถรีเซ็ตรหัสผ่านได้' };
    }
  };

  // 5. Delete Employee
  const deleteEmployee = async (empId: string) => {
    try {
      await deleteEmployeeAction(empId);
      await fetchEmployees();
      return { success: true };
    } catch (err) {
      console.error('Error deleting employee:', err);
      return { success: false, error: 'ไม่สามารถลบรายชื่อพนักงานได้' };
    }
  };

  // ----------------------------------------------------

  // Security guard check
  useEffect(() => {
    async function init() {
      const session = await checkCurrentSession();
      if (!session || session.role !== 'admin') {
        router.push('/');
        return;
      }
      setAuthLoading(false);
      
      // Load departments first, then employees
      try {
        const depts = await fetchDepartmentsAction();
        setDeptOptions(depts);
        
        const prefs = await fetchPrefixesAction();
        setPrefixes(prefs);
      } catch (err) {
        console.error('Failed to load departments', err);
      }

      fetchEmployees();
    }
    init();
  }, [router]);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push('/');
    });
  };

  // Filters logic
  const filteredEmployees = employees.filter(emp => {
    const nameStr = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const searchMatch = 
      nameStr.includes(search.toLowerCase()) || 
      emp.id.toLowerCase().includes(search.toLowerCase()) ||
      emp.username.toLowerCase().includes(search.toLowerCase());

    const deptMatch = deptFilter === 'All' || emp.department === deptFilter;
    const statusMatch = statusFilter === 'All' || emp.status === statusFilter;

    return searchMatch && deptMatch && statusMatch;
  });

  // Action Triggers
  const openAddModal = () => {
    setValidationError('');
    const defaultPrefix = prefixes.length > 0 ? prefixes[0].prefix : 'EMP';
    setFormEmpPrefix(defaultPrefix);
    setFormId(`${defaultPrefix}${String(employees.length + 1).padStart(3, '0')}`);
    setFormFirstName('');
    setFormLastName('');
    setFormDepartment('Engineering');
    setFormRole('');
    setFormUsername('');
    setFormPassword('');
    setFormConfirmPassword('');
    setFormStatus('active');
    setFormRoleType('employee');
    setFormForceReset(false);
    setActiveModal('add');
  };

  const openEditModal = (emp: Employee) => {
    setValidationError('');
    setSelectedEmployee(emp);
    const prefixMatch = prefixes.find(p => emp.id.startsWith(p.prefix));
    setFormEmpPrefix(prefixMatch ? prefixMatch.prefix : 'EMP');
    setFormId(emp.id);
    setFormFirstName(emp.firstName);
    setFormLastName(emp.lastName);
    setFormDepartment(emp.department);
    setFormRole(emp.role);
    setFormUsername(emp.username);
    setFormStatus(emp.status);
    setFormRoleType(emp.roleType || 'employee');
    setActiveModal('edit');
  };

  const openViewModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setActiveModal('view');
  };

  const openResetPasswordModal = (emp: Employee) => {
    setValidationError('');
    setSelectedEmployee(emp);
    setFormPassword('');
    setFormConfirmPassword('');
    setFormForceReset(true);
    setActiveModal('reset-password');
  };

  const openDeleteModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setActiveModal('delete');
  };

  // Submit Handlers
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (formPassword !== formConfirmPassword) {
      setValidationError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (employees.some(emp => emp.id === formId)) {
      setValidationError('รหัสพนักงานนี้มีอยู่ในระบบแล้ว');
      return;
    }

    if (employees.some(emp => emp.username === formUsername)) {
      setValidationError('Username นี้ถูกใช้งานแล้ว');
      return;
    }

    if (formRoleType === 'admin' && formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP') {
      setValidationError('สิทธิ์แอดมินสามารถกำหนดให้กับรหัสพนักงานที่ขึ้นต้นด้วย ADM หรือ EMP เท่านั้น');
      return;
    }

    const newEmp: Employee = {
      id: formId,
      firstName: formFirstName,
      lastName: formLastName,
      department: formDepartment,
      role: formRole,
      username: formUsername,
      status: formStatus,
      createdDate: new Date().toISOString().split('T')[0],
      forcePasswordChange: formForceReset,
      roleType: formRoleType
    };

    const res = await createEmployee(newEmp);
    if (res.success) {
      setActiveModal('none');
    } else {
      setValidationError(res.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedEmployee) return;

    // Check username unique except itself
    if (employees.some(emp => emp.username === formUsername && emp.id !== selectedEmployee.id)) {
      setValidationError('Username นี้ถูกใช้งานโดยพนักงานท่านอื่นแล้ว');
      return;
    }

    if (formRoleType === 'admin' && formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP') {
      setValidationError('สิทธิ์แอดมินสามารถกำหนดให้กับรหัสพนักงานที่ขึ้นต้นด้วย ADM หรือ EMP เท่านั้น');
      return;
    }

    const updatedEmp: Employee = {
      ...selectedEmployee,
      firstName: formFirstName,
      lastName: formLastName,
      department: formDepartment,
      role: formRole,
      username: formUsername,
      status: formStatus,
      roleType: formRoleType
    };

    const res = await updateEmployee(updatedEmp);
    if (res.success) {
      setActiveModal('none');
    } else {
      setValidationError(res.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedEmployee) return;

    if (formPassword !== formConfirmPassword) {
      setValidationError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    const res = await resetPassword(selectedEmployee.id, formPassword, formForceReset);
    if (res.success) {
      setActiveModal('none');
      alert('รีเซ็ตรหัสผ่านสําเร็จ');
    } else {
      setValidationError(res.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEmployee) return;
    const res = await deleteEmployee(selectedEmployee.id);
    if (res.success) {
      setActiveModal('none');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-slate-400 mt-4 font-medium animate-pulse">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Logo */}
          <div className="flex items-center justify-between w-full mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md">
                A
              </div>
              <div>
                <h2 className="font-extrabold tracking-tight text-md">AttendHub</h2>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">แผงควบคุมแอดมิน</span>
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <a 
              href="/admin"
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg text-sm font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              ภาพรวมการเข้างาน
            </a>
            <a 
              href="#"
              onClick={(e) => e.preventDefault()}
              className="flex items-center gap-3 px-4 py-3 bg-indigo-600/10 border-l-2 border-indigo-500 rounded-lg text-sm font-semibold text-indigo-400 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              จัดการข้อมูลพนักงาน
            </a>
            <a 
              href="/admin/departments" 
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg text-sm font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              จัดการแผนก
            </a>
            <a 
              href="/admin/leaves" 
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg text-sm font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              คำขอลางาน
            </a>
            <a 
              href="/admin/reports" 
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg text-sm font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              ออกรายงาน
            </a>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="pt-6 border-t border-slate-800 mt-6 md:mt-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white uppercase">
              AD
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300 leading-none">ผู้ดูแลระบบ</p>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ออนไลน์
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-750 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">จัดการข้อมูลพนักงาน</h1>
            <p className="text-slate-400 text-sm mt-1">
              เพิ่ม ลบ แก้ไข ข้อมูลพนักงานและสิทธิ์บัญชีผู้ใช้
            </p>
          </div>
          <div>
            <button
              onClick={openAddModal}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white dark:text-white !text-white text-sm font-semibold rounded-xl transition duration-200 shadow-lg shadow-indigo-600/10 flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-white dark:text-white !text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
              </svg>
              เพิ่มพนักงาน
            </button>
          </div>
        </header>

        {/* Search & Filters Panel */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
          {/* Search Box */}
          <div className="relative w-full md:flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </span>
            <input
              type="text"
              placeholder="ค้นหาด้วยชื่อ หรือรหัสพนักงาน..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-500/70 border border-slate-800 text-sm focus:outline-none focus:border-indigo-500 text-slate-200 placeholder-slate-650"
            />
          </div>

          {/* Department Filter */}
          <div className="w-full md:w-48">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">ทุกแผนก (All)</option>
              {deptOptions.map(dept => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">ทุกสถานะ (All)</option>
              <option value="active">ใช้งาน (Active)</option>
              <option value="suspended">ระงับ (Suspended)</option>
            </select>
          </div>
        </section>

        {/* Employee Table Section */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-4">รหัสพนักงาน</th>
                  <th className="py-4 px-4">ชื่อ-นามสกุล</th>
                  <th className="py-4 px-4">แผนก</th>
                  <th className="py-4 px-4">ตำแหน่ง</th>
                  <th className="py-4 px-4">Username</th>
                  <th className="py-4 px-4">สิทธิ์ระบบ</th>
                  <th className="py-4 px-4">สถานะ</th>
                  <th className="py-4 px-4">วันที่สร้างบัญชี</th>
                  <th className="py-4 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-850/30 transition">
                      <td className="py-4 px-4 font-mono text-slate-400 font-semibold">{emp.id}</td>
                      <td className="py-4 px-4 font-semibold text-slate-200">{emp.firstName} {emp.lastName}</td>
                      <td className="py-4 px-4 text-slate-300">{emp.department}</td>
                      <td className="py-4 px-4 text-slate-400">{emp.role}</td>
                      <td className="py-4 px-4 font-mono text-slate-400">{emp.username}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          emp.roleType === 'admin' 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {emp.roleType === 'admin' ? 'แอดมิน' : 'พนักงาน'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          emp.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {emp.status === 'active' ? 'ใช้งาน' : 'ระงับ'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400 font-mono">{emp.createdDate}</td>
                      <td className="py-4 px-4">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => openViewModal(emp)}
                            className="group relative p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                            title="ดูข้อมูล"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg border border-slate-700">ดูข้อมูล</span>
                          </button>
                          <button
                            onClick={() => openEditModal(emp)}
                            className="group relative p-2 bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-400 border border-indigo-950 rounded-lg transition cursor-pointer"
                            title="แก้ไข"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5l13.732-13.732z" />
                            </svg>
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg border border-slate-700">แก้ไข</span>
                          </button>
                          <button
                            onClick={() => openResetPasswordModal(emp)}
                            className="group relative p-2 bg-amber-950/40 hover:bg-amber-900/40 text-amber-400 border border-amber-950 rounded-lg transition cursor-pointer"
                            title="รีเซ็ตรหัสผ่าน"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg border border-slate-700">รีเซ็ต</span>
                          </button>
                          <button
                            onClick={() => openDeleteModal(emp)}
                            className="group relative p-2 bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-950 rounded-lg transition cursor-pointer"
                            title="ลบ"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg border border-slate-700">ลบ</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
                      ไม่พบรายชื่อพนักงานในระบบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* ------------------------------------------------------------------------------------------------------ */}
      {/* 1. Add Employee Modal */}
      {/* ------------------------------------------------------------------------------------------------------ */}
      {activeModal === 'add' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-scale-in relative">
            <h3 className="text-xl font-bold text-slate-100 mb-2">เพิ่มบัญชีพนักงานใหม่</h3>
            <p className="text-xs text-slate-400 mb-5">กรอกข้อมูลเพื่อสร้างบัญชีพนักงานเข้าสู่ระบบ</p>
            
            {validationError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium text-center">
                {validationError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">คำนำหน้า</label>
                    <select
                      value={formEmpPrefix}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormEmpPrefix(val);
                        setFormId(`${val}${formId.replace(/^[a-zA-Z]+/, '')}`);
                        if (formRoleType === 'admin' && val !== 'ADM' && val !== 'EMP') {
                          setFormRoleType('employee');
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {prefixes.length > 0 ? prefixes.map(p => (
                        <option key={p.id} value={p.prefix}>{p.prefix} - {p.label}</option>
                      )) : (
                        <>
                          <option value="EMP">EMP</option>
                          <option value="INT">INT</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="w-2/3">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">รหัสพนักงาน</label>
                    <input
                      type="text"
                      required
                      value={formId}
                      onChange={(e) => setFormId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Username</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="เช่น somchai.r"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">ชื่อจริง</label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">นามสกุล</label>
                  <input
                    type="text"
                    required
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">แผนก</label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {deptOptions.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">ตำแหน่ง</label>
                  <input
                    type="text"
                    required
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="เช่น Developer, HR Staff"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">กำหนดรหัสผ่าน</label>
                  <input
                    type="password"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">ยืนยันรหัสผ่าน</label>
                  <input
                    type="password"
                    required
                    value={formConfirmPassword}
                    onChange={(e) => setFormConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">สถานะบัญชีพนักงาน</label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={formStatus === 'active'}
                        onChange={() => setFormStatus('active')}
                        className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0 focus:ring-offset-0"
                      />
                      ใช้งาน (Active)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={formStatus === 'suspended'}
                        onChange={() => setFormStatus('suspended')}
                        className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0 focus:ring-offset-0"
                      />
                      ระงับ (Suspended)
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">สิทธิ์การใช้งานระบบ</label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={formRoleType === 'employee'}
                        onChange={() => setFormRoleType('employee')}
                        className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0 focus:ring-offset-0"
                      />
                      พนักงาน (Employee)
                    </label>
                    <label className={`flex items-center gap-1.5 text-xs text-slate-300 ${formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                      <input
                        type="radio"
                        checked={formRoleType === 'admin'}
                        onChange={() => setFormRoleType('admin')}
                        disabled={formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP'}
                        className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0 focus:ring-offset-0 disabled:opacity-50"
                      />
                      แอดมิน (Admin)
                    </label>
                  </div>
                </div>
              </div>



              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-600/10 cursor-pointer"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------------------------------------ */}
      {/* 2. Edit Employee Modal */}
      {/* ------------------------------------------------------------------------------------------------------ */}
      {activeModal === 'edit' && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-scale-in">
            <h3 className="text-xl font-bold text-slate-100 mb-2">แก้ไขข้อมูลพนักงาน</h3>
            <p className="text-xs text-slate-400 mb-5">แก้ไขรายละเอียดบัญชีพนักงาน รหัสพนักงานจะไม่สามารถเปลี่ยนได้</p>

            {validationError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium text-center">
                {validationError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">เปลี่ยนคำนำหน้า</label>
                    <select
                      value={formEmpPrefix}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormEmpPrefix(val);
                        setFormId(`${val}${formId.replace(/^[a-zA-Z]+/, '')}`);
                        if (formRoleType === 'admin' && val !== 'ADM' && val !== 'EMP') {
                          setFormRoleType('employee');
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {prefixes.length > 0 ? prefixes.map(p => (
                        <option key={p.id} value={p.prefix}>{p.prefix} - {p.label}</option>
                      )) : (
                        <>
                          <option value="EMP">EMP</option>
                          <option value="INT">INT</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="w-2/3">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">รหัสพนักงาน</label>
                    <input
                      type="text"
                      disabled
                      value={formId}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800/80 text-sm text-slate-500 font-mono cursor-not-allowed opacity-60"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Username</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">ชื่อจริง</label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">นามสกุล</label>
                  <input
                    type="text"
                    required
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">แผนก</label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {deptOptions.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">ตำแหน่ง</label>
                  <input
                    type="text"
                    required
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="py-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">สถานะการใช้งาน</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      checked={formStatus === 'active'}
                      onChange={() => setFormStatus('active')}
                      className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0"
                    />
                    ใช้งาน (Active)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      checked={formStatus === 'suspended'}
                      onChange={() => setFormStatus('suspended')}
                      className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0"
                    />
                    ระงับ (Suspended)
                  </label>
                </div>
              </div>

              <div className="py-2 border-t border-slate-800/60 pt-4">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">สิทธิ์การใช้งานระบบ</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      checked={formRoleType === 'employee'}
                      onChange={() => setFormRoleType('employee')}
                      className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0"
                    />
                    พนักงาน (Employee)
                  </label>
                  <label className={`flex items-center gap-1.5 text-xs text-slate-300 ${formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                    <input
                      type="radio"
                      checked={formRoleType === 'admin'}
                      onChange={() => setFormRoleType('admin')}
                      disabled={formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP'}
                      className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0 disabled:opacity-50"
                    />
                    แอดมิน (Admin)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-lg cursor-pointer"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------------------------------------ */}
      {/* 3. View Employee Modal */}
      {/* ------------------------------------------------------------------------------------------------------ */}
      {activeModal === 'view' && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-scale-in">
            <h3 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-800 pb-3">รายละเอียดข้อมูลพนักงาน</h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between py-1 border-b border-slate-850/40">
                <span className="text-slate-400 text-xs">รหัสพนักงาน</span>
                <span className="font-mono font-bold text-slate-200">{selectedEmployee.id}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-850/40">
                <span className="text-slate-400 text-xs">ชื่อ - นามสกุล</span>
                <span className="font-semibold text-slate-200">{selectedEmployee.firstName} {selectedEmployee.lastName}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-850/40">
                <span className="text-slate-400 text-xs">แผนก</span>
                <span className="text-slate-200">{selectedEmployee.department}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-850/40">
                <span className="text-slate-400 text-xs">ตำแหน่ง</span>
                <span className="text-slate-200">{selectedEmployee.role}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-850/40">
                <span className="text-slate-400 text-xs">Username</span>
                <span className="font-mono text-slate-250">{selectedEmployee.username}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-850/40">
                <span className="text-slate-400 text-xs">สิทธิ์ระบบ</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                  selectedEmployee.roleType === 'admin' 
                    ? 'bg-amber-500/15 text-amber-400' 
                    : 'bg-slate-500/15 text-slate-400'
                }`}>
                  {selectedEmployee.roleType === 'admin' ? 'แอดมิน (Admin)' : 'พนักงาน (Employee)'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-850/40">
                <span className="text-slate-400 text-xs">สถานะ</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  selectedEmployee.status === 'active' 
                    ? 'bg-emerald-500/15 text-emerald-400' 
                    : 'bg-rose-500/15 text-rose-400'
                }`}>
                  {selectedEmployee.status === 'active' ? 'ใช้งาน' : 'ระงับการใช้งาน'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-850/40">
                <span className="text-slate-400 text-xs">วันที่สร้างบัญชี</span>
                <span className="text-slate-300 font-mono">{selectedEmployee.createdDate}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-850/40">
                <span className="text-slate-400 text-xs">บังคับเปลี่ยนรหัสผ่านเมื่อเข้าระบบครั้งแรก</span>
                <span className={`font-semibold ${selectedEmployee.forcePasswordChange ? 'text-amber-400' : 'text-slate-500'}`}>
                  {selectedEmployee.forcePasswordChange ? 'ใช่ (รอดำเนินการ)' : 'ไม่'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-800 mt-6">
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition w-full cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------------------------------------ */}
      {/* 4. Reset Password Modal */}
      {/* ------------------------------------------------------------------------------------------------------ */}
      {activeModal === 'reset-password' && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-scale-in">
            <h3 className="text-xl font-bold text-slate-100 mb-2">รีเซ็ตรหัสผ่านพนักงาน</h3>
            <p className="text-xs text-slate-400 mb-5">
              ตั้งค่ารหัสผ่านใหม่ให้กับ <span className="text-indigo-400 font-semibold">{selectedEmployee.firstName} {selectedEmployee.lastName}</span>
            </p>

            {validationError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium text-center">
                {validationError}
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">รหัสผ่านใหม่</label>
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
                <input
                  type="password"
                  required
                  value={formConfirmPassword}
                  onChange={(e) => setFormConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2.5 text-xs text-slate-350 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formForceReset}
                    onChange={(e) => setFormForceReset(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  บังคับเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งแรก
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-lg cursor-pointer"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------------------------------------ */}
      {/* 5. Delete Confirmation Modal */}
      {/* ------------------------------------------------------------------------------------------------------ */}
      {activeModal === 'delete' && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-scale-in text-center">
            
            {/* Warning Icon */}
            <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>

            <h3 className="text-lg font-bold text-slate-100 mb-2">ยืนยันการลบรายชื่อ</h3>
            <p className="text-sm text-slate-400 mb-6">
              คุณต้องการลบพนักงาน <span className="text-slate-200 font-bold">{selectedEmployee.firstName} {selectedEmployee.lastName}</span> ({selectedEmployee.id}) รายนี้ใช่หรือไม่?
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-350 text-sm font-semibold rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-rose-600/10 cursor-pointer"
              >
                ลบข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS for CSS-only simple keyframe transitions */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

    </div>
  );
}
