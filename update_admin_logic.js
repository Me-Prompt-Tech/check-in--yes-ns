const fs = require('fs');

const path = './app/admin/employees/page.tsx';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// 1. handleAddSubmit
const add_from = `    if (employees.some(emp => emp.username === formUsername)) {
      setValidationError('Username นี้ถูกใช้งานแล้ว');
      return;
    }

    const newEmp: Employee = {`;

const add_to = `    if (employees.some(emp => emp.username === formUsername)) {
      setValidationError('Username นี้ถูกใช้งานแล้ว');
      return;
    }

    if (formRoleType === 'admin' && formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP') {
      setValidationError('สิทธิ์แอดมินสามารถกำหนดให้กับรหัสพนักงานที่ขึ้นต้นด้วย ADM หรือ EMP เท่านั้น');
      return;
    }

    const newEmp: Employee = {`;

// 2. handleEditSubmit
const edit_from = `    if (employees.some(emp => emp.username === formUsername && emp.id !== selectedEmployee.id)) {
      setValidationError('Username นี้ถูกใช้งานโดยพนักงานท่านอื่นแล้ว');
      return;
    }

    const updatedEmp: Employee = {`;

const edit_to = `    if (employees.some(emp => emp.username === formUsername && emp.id !== selectedEmployee.id)) {
      setValidationError('Username นี้ถูกใช้งานโดยพนักงานท่านอื่นแล้ว');
      return;
    }

    if (formRoleType === 'admin' && formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP') {
      setValidationError('สิทธิ์แอดมินสามารถกำหนดให้กับรหัสพนักงานที่ขึ้นต้นด้วย ADM หรือ EMP เท่านั้น');
      return;
    }

    const updatedEmp: Employee = {`;

// 3. Admin radio add & edit
const radio_from = `                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={formRoleType === 'admin'}
                        onChange={() => setFormRoleType('admin')}
                        className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0 focus:ring-offset-0"
                      />
                      แอดมิน (Admin)
                    </label>`;

const radio_to = `                    <label className={\`flex items-center gap-1.5 text-xs text-slate-300 \${formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}\`}>
                      <input
                        type="radio"
                        checked={formRoleType === 'admin'}
                        onChange={() => setFormRoleType('admin')}
                        disabled={formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP'}
                        className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0 focus:ring-offset-0 disabled:opacity-50"
                      />
                      แอดมิน (Admin)
                    </label>`;

const radio2_from = `                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      checked={formRoleType === 'admin'}
                      onChange={() => setFormRoleType('admin')}
                      className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0"
                    />
                    แอดมิน (Admin)
                  </label>`;

const radio2_to = `                  <label className={\`flex items-center gap-1.5 text-xs text-slate-300 \${formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}\`}>
                    <input
                      type="radio"
                      checked={formRoleType === 'admin'}
                      onChange={() => setFormRoleType('admin')}
                      disabled={formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP'}
                      className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0 disabled:opacity-50"
                    />
                    แอดมิน (Admin)
                  </label>`;

// Apply replacements
if (content.includes(add_from)) {
  content = content.replace(add_from, add_to);
  console.log("Applied add validation");
} else {
  console.log("Failed to find add validation target");
}

if (content.includes(edit_from)) {
  content = content.replace(edit_from, edit_to);
  console.log("Applied edit validation");
} else {
  console.log("Failed to find edit validation target");
}

if (content.includes(radio_from)) {
  content = content.replace(radio_from, radio_to);
  console.log("Applied radio 1");
} else {
  console.log("Failed to find radio 1 target");
}

if (content.includes(radio2_from)) {
  content = content.replace(radio2_from, radio2_to);
  console.log("Applied radio 2");
} else {
  console.log("Failed to find radio 2 target");
}

fs.writeFileSync(path, content);
console.log("Done");
