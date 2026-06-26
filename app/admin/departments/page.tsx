'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { checkCurrentSession, logoutAction } from '../../actions/auth';
import { fetchDepartmentsAction, createDepartmentAction, updateDepartmentAction, deleteDepartmentAction, DBDepartment } from '../../actions/departments';
import { fetchPrefixesAction, createPrefixAction, updatePrefixAction, deletePrefixAction, DBEmployeePrefix } from '../../actions/prefixes';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function DepartmentManagement() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [authLoading, setAuthLoading] = useState(true);

  const [departments, setDepartments] = useState<DBDepartment[]>([]);
  const [prefixes, setPrefixes] = useState<DBEmployeePrefix[]>([]);
  const [search, setSearch] = useState('');

  // Modals state
  const [activeModal, setActiveModal] = useState<'none' | 'add' | 'edit' | 'delete' | 'addPrefix' | 'editPrefix' | 'deletePrefix'>('none');
  const [selectedDept, setSelectedDept] = useState<DBDepartment | null>(null);
  const [selectedPrefix, setSelectedPrefix] = useState<DBEmployeePrefix | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPrefix, setFormPrefix] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    async function init() {
      const session = await checkCurrentSession();
      if (!session || session.role !== 'admin') {
        router.push('/');
        return;
      }
      setAuthLoading(false);
      loadDepartments();
      loadPrefixes();
    }
    init();
  }, [router]);

  const loadPrefixes = async () => {
    try {
      const data = await fetchPrefixesAction();
      setPrefixes(data);
    } catch (err) {
      console.error('Failed to fetch prefixes:', err);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await fetchDepartmentsAction();
      setDepartments(data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push('/');
    });
  };

  const filteredDepts = departments.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  // Add Handlers
  const openAddModal = () => {
    setFormName('');
    setValidationError('');
    setActiveModal('add');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    startTransition(async () => {
      const res = await createDepartmentAction(formName);
      if (res.success) {
        await loadDepartments();
        setActiveModal('none');
      } else {
        setValidationError(res.error || 'Failed to add department');
      }
    });
  };

  // Edit Handlers
  const openEditModal = (dept: DBDepartment) => {
    setSelectedDept(dept);
    setFormName(dept.name);
    setValidationError('');
    setActiveModal('edit');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    if (!selectedDept) return;
    startTransition(async () => {
      const res = await updateDepartmentAction(selectedDept.id, formName);
      if (res.success) {
        await loadDepartments();
        setActiveModal('none');
      } else {
        setValidationError(res.error || 'Failed to update department');
      }
    });
  };

  // Delete Handlers
  const openDeleteModal = (dept: DBDepartment) => {
    setSelectedDept(dept);
    setActiveModal('delete');
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDept) return;
    startTransition(async () => {
      const res = await deleteDepartmentAction(selectedDept.id);
      if (res.success) {
        await loadDepartments();
        setActiveModal('none');
      }
    });
  };


  // Prefix Handlers
  const openAddPrefixModal = () => {
    setFormPrefix('');
    setFormLabel('');
    setValidationError('');
    setActiveModal('addPrefix');
  };

  const handleAddPrefixSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    startTransition(async () => {
      const res = await createPrefixAction(formPrefix, formLabel);
      if (res.success) {
        await loadPrefixes();
        setActiveModal('none');
      } else {
        setValidationError(res.error || 'Failed to add prefix');
      }
    });
  };

  const openEditPrefixModal = (prefix: DBEmployeePrefix) => {
    setSelectedPrefix(prefix);
    setFormPrefix(prefix.prefix);
    setFormLabel(prefix.label);
    setValidationError('');
    setActiveModal('editPrefix');
  };

  const handleEditPrefixSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    if (!selectedPrefix) return;
    startTransition(async () => {
      const res = await updatePrefixAction(selectedPrefix.id, formPrefix, formLabel);
      if (res.success) {
        await loadPrefixes();
        setActiveModal('none');
      } else {
        setValidationError(res.error || 'Failed to update prefix');
      }
    });
  };

  const openDeletePrefixModal = (prefix: DBEmployeePrefix) => {
    setSelectedPrefix(prefix);
    setActiveModal('deletePrefix');
  };

  const handleDeletePrefixConfirm = async () => {
    if (!selectedPrefix) return;
    startTransition(async () => {
      const res = await deletePrefixAction(selectedPrefix.id);
      if (res.success) {
        await loadPrefixes();
        setActiveModal('none');
      }
    });
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
              href="/admin/employees"
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 rounded-lg text-sm font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              จัดการข้อมูลพนักงาน
            </a>
            <a 
              href="#"
              onClick={(e) => e.preventDefault()}
              className="flex items-center gap-3 px-4 py-3 bg-indigo-600/10 border-l-2 border-indigo-500 rounded-lg text-sm font-semibold text-indigo-400 transition"
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
            <a
              href="/employee"
              className="flex items-center gap-3 px-4 py-3 text-emerald-400 hover:bg-emerald-900/30 hover:text-emerald-300 rounded-lg text-sm font-medium transition mt-4 border border-emerald-500/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ลงเวลาทำงาน (ผู้ใช้ทั่วไป)
            </a>
          </nav>
        </div>

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
        
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">จัดการแผนก (Departments)</h1>
            <p className="text-slate-400 text-sm mt-1">
              เพิ่ม ลบ แก้ไข ข้อมูลแผนกในบริษัท
            </p>
          </div>
          <div>
            <button
              onClick={openAddModal}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition duration-200 shadow-lg shadow-indigo-600/10 flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
              </svg>
              เพิ่มแผนก
            </button>
          </div>
        </header>

        {/* Search */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </span>
            <input
              type="text"
              placeholder="ค้นหาชื่อแผนก..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm focus:outline-none focus:border-indigo-500 text-slate-200 placeholder-slate-650"
            />
          </div>
        </section>

        {/* Departments List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepts.length > 0 ? (
            filteredDepts.map((dept) => (
              <div key={dept.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between group hover:border-slate-700 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  </div>
                  <div>
                    <h3 className="text-slate-200 font-semibold">{dept.name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                                                      <button onClick={() => openEditModal(dept)} className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  </button>
                  <button onClick={() => openDeleteModal(dept)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
              <svg className="w-12 h-12 mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              <p>ไม่พบแผนกที่ค้นหา</p>
            </div>
          )}
        </div>

        {/* ------------------------------------------- */}
        {/* PREFIX SECTION */}
        {/* ------------------------------------------- */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 mt-12">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">จัดการรหัสนำหน้าพนักงาน</h2>
            <p className="text-slate-400 text-sm mt-1">
              จัดการคำนำหน้าสำหรับสร้างรหัสพนักงาน (เช่น EMP, INT)
            </p>
          </div>
          <div>
            <button
              onClick={openAddPrefixModal}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition duration-200 shadow-lg shadow-indigo-600/10 flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
              </svg>
              เพิ่มรหัสนำหน้า
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
          {prefixes.length > 0 ? (
            prefixes.map((pref) => (
              <div key={pref.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between group hover:border-slate-700 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-mono font-bold text-xs">
                    {pref.prefix}
                  </div>
                  <div>
                    <h3 className="text-slate-200 font-semibold">{pref.label}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{pref.prefix}XXX</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                  <button onClick={() => openEditPrefixModal(pref)} className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  </button>
                  <button onClick={() => openDeletePrefixModal(pref)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl border-dashed">
              ไม่พบข้อมูลรหัสนำหน้าพนักงาน
            </div>
          )}
        </div>

      </main>

      {/* Add / Edit Modal */}
      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal('none')}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-900/50 flex justify-between items-center">
              <h3 className="font-bold text-lg">{activeModal === 'add' ? 'เพิ่มแผนกใหม่' : 'แก้ไขชื่อแผนก'}</h3>
              <button onClick={() => setActiveModal('none')} className="text-slate-500 hover:text-slate-300 transition cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={activeModal === 'add' ? handleAddSubmit : handleEditSubmit} className="p-6">
              {validationError && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-medium">
                  {validationError}
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-400 mb-2">ชื่อแผนก</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น Engineering, HR, Sales..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isPending ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : null}
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {activeModal === 'delete' && selectedDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal('none')}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">ยืนยันการลบแผนก</h3>
            <p className="text-sm text-slate-400 mb-6">
              คุณต้องการลบแผนก <span className="font-semibold text-rose-400">"{selectedDept.name}"</span> ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setActiveModal('none')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-rose-900/20 cursor-pointer disabled:opacity-50"
              >
                {isPending ? 'กำลังลบ...' : 'ยืนยันการลบ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prefix Modals */}
      {(activeModal === 'addPrefix' || activeModal === 'editPrefix') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal('none')}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-900/50 flex justify-between items-center">
              <h3 className="font-bold text-lg">{activeModal === 'addPrefix' ? 'เพิ่มรหัสนำหน้าใหม่' : 'แก้ไขรหัสนำหน้า'}</h3>
              <button onClick={() => setActiveModal('none')} className="text-slate-500 hover:text-slate-300 transition cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={activeModal === 'addPrefix' ? handleAddPrefixSubmit : handleEditPrefixSubmit} className="p-6">
              {validationError && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-medium">
                  {validationError}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-400 mb-2">รหัสนำหน้า (Prefix)</label>
                <input
                  type="text"
                  required
                  value={formPrefix}
                  onChange={(e) => setFormPrefix(e.target.value.toUpperCase())}
                  placeholder="เช่น EMP, INT..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-400 mb-2">ชื่อเรียก (Label)</label>
                <input
                  type="text"
                  required
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="เช่น พนักงานทั่วไป, นักศึกษาฝึกงาน..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'deletePrefix' && selectedPrefix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal('none')}></div>
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">ยืนยันการลบ</h3>
            <p className="text-sm text-slate-400 mb-6">
              คุณต้องการลบคำนำหน้า <span className="font-semibold text-rose-400">"{selectedPrefix.prefix}"</span> ใช่หรือไม่?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setActiveModal('none')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeletePrefixConfirm}
                disabled={isPending}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-rose-900/20 cursor-pointer disabled:opacity-50"
              >
                {isPending ? 'กำลังลบ...' : 'ยืนยันการลบ'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
