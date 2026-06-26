const fs = require('fs');
let code = fs.readFileSync('app/admin/employees/page.tsx', 'utf8');

// I will fix the functions from `// 2. Create Employee` up to `// 5. Delete Employee`
const correctFunctions = `
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
  const updateEmployee = async (updatedEmp: Employee, oldId?: string) => {
    try {
      await updateEmployeeAction(updatedEmp as any, oldId);
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
`;

code = code.replace(/\/\/ 2\. Create Employee[\s\S]*?\/\/ 5\. Delete Employee/, correctFunctions.trim() + '\n\n  // 5. Delete Employee');

code = code.replace(/try \{\r?\n\s*const depts = await fetchDepartmentsAction\(\);\r?\n\s*setDeptOptions\(depts\);\r?\n\s*\} catch \(err\) \{/,
`try {
        const depts = await fetchDepartmentsAction();
        setDeptOptions(depts);
        
        const prefs = await fetchPrefixesAction();
        setPrefixes(prefs);
      } catch (err) {`);

code = code.replace(/const openAddModal = \(\) => \{\r?\n\s*setValidationError\(''\);\r?\n\s*setFormId\(\`EMP\$\{String\(employees\.length \+ 1\)\.padStart\(3, '0'\)\}\`\);/,
`const openAddModal = () => {
    setValidationError('');
    const defaultPrefix = prefixes.length > 0 ? prefixes[0].prefix : 'EMP';
    setFormEmpPrefix(defaultPrefix);
    setFormId(\`\${defaultPrefix}\${String(employees.length + 1).padStart(3, '0')}\`);`);

code = code.replace(/const openEditModal = \(emp: Employee\) => \{\r?\n\s*setValidationError\(''\);\r?\n\s*setSelectedEmployee\(emp\);\r?\n\s*setFormId\(emp\.id\);/,
`const openEditModal = (emp: Employee) => {
    setValidationError('');
    setSelectedEmployee(emp);
    const prefixMatch = prefixes.find(p => emp.id.startsWith(p.prefix));
    setFormEmpPrefix(prefixMatch ? prefixMatch.prefix : 'EMP');
    setFormId(emp.id);`);

code = code.replace(/const updatedEmp: Employee = \{\r?\n\s*\.\.\.selectedEmployee,\r?\n\s*firstName: formFirstName,/,
`const updatedEmp: Employee = {
      ...selectedEmployee,
      id: formId,
      firstName: formFirstName,`);
code = code.replace(/const res = await updateEmployee\\(updatedEmp\\);/, `const res = await updateEmployee(updatedEmp, selectedEmployee.id);`);

code = code.replace(/<div className="grid grid-cols-2 gap-4">\r?\n\s*<div>\r?\n\s*<label className="block text-xs font-semibold text-slate-400 mb-1\.5">รหัสพนักงาน<\/label>\r?\n\s*<input\r?\n\s*type="text"\r?\n\s*required\r?\n\s*value=\{formId\}\r?\n\s*onChange=\{\(e\) => setFormId\(e\.target\.value\)\}\r?\n\s*className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"\r?\n\s*\/>\r?\n\s*<\/div>/,
`<div className="grid grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">คำนำหน้า</label>
                    <select
                      value={formEmpPrefix}
                      onChange={(e) => {
                        setFormEmpPrefix(e.target.value);
                        setFormId(\`\${e.target.value}\${formId.replace(/^[a-zA-Z]+/, '')}\`);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {prefixes.length > 0 ? prefixes.map(p => (
                        <option key={p.id} value={p.prefix}>{p.prefix}</option>
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
                </div>`);

code = code.replace(/<div className="grid grid-cols-2 gap-4">\r?\n\s*<div>\r?\n\s*<label className="block text-xs font-semibold text-slate-500 mb-1\.5">รหัสพนักงาน \(ไม่สามารถแก้ไขได้\)<\/label>\r?\n\s*<input\r?\n\s*type="text"\r?\n\s*disabled\r?\n\s*value=\{formId\}\r?\n\s*className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800\/80 text-sm text-slate-500 font-mono cursor-not-allowed opacity-60"\r?\n\s*\/>\r?\n\s*<\/div>/,
`<div className="grid grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">เปลี่ยนคำนำหน้า</label>
                    <select
                      value={formEmpPrefix}
                      onChange={(e) => {
                        setFormEmpPrefix(e.target.value);
                        setFormId(\`\${e.target.value}\${formId.replace(/^[a-zA-Z]+/, '')}\`);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {prefixes.length > 0 ? prefixes.map(p => (
                        <option key={p.id} value={p.prefix}>{p.prefix}</option>
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
                </div>`);

fs.writeFileSync('app/admin/employees/page.tsx', code);
