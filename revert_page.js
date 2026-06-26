const fs = require('fs');

let content = fs.readFileSync('app/admin/employees/page.tsx', 'utf-8');

// 1. Revert Add Submit
content = content.replace(
`    if (formRoleType === 'admin' && formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP') {
      setValidationError('สิทธิ์แอดมินสามารถกำหนดให้กับรหัสพนักงานที่ขึ้นต้นด้วย ADM หรือ EMP เท่านั้น');
      return;
    }

    const newEmp: Employee = {`,
`    const newEmp: Employee = {`
);

// 2. Revert Edit Submit
content = content.replace(
`    if (formRoleType === 'admin' && formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP') {
      setValidationError('สิทธิ์แอดมินสามารถกำหนดให้กับรหัสพนักงานที่ขึ้นต้นด้วย ADM หรือ EMP เท่านั้น');
      return;
    }

    const updatedEmp: Employee = {`,
`    const updatedEmp: Employee = {`
);

// 3. Revert onChange in Add and Edit Modals
const onChangeRevertFrom = `                      onChange={(e) => {
                        const val = e.target.value;
                        setFormEmpPrefix(val);
                        setFormId(\`\${val}\${formId.replace(/^[a-zA-Z]+/, '')}\`);
                        if (formRoleType === 'admin' && val !== 'ADM' && val !== 'EMP') {
                          setFormRoleType('employee');
                        }
                      }}`;
const onChangeRevertTo = `                      onChange={(e) => {
                        const val = e.target.value;
                        setFormEmpPrefix(val);
                        setFormId(\`\${val}\${formId.replace(/^[a-zA-Z]+/, '')}\`);
                      }}`;

// Replace all occurrences (should be 2)
content = content.split(onChangeRevertFrom).join(onChangeRevertTo);


// 4. Revert Add Modal Radio
const addRadioFrom = `                    <label className={\`flex items-center gap-1.5 text-xs text-slate-300 \${formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}\`}>
                      <input
                        type="radio"
                        checked={formRoleType === 'admin'}
                        onChange={() => setFormRoleType('admin')}
                        disabled={formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP'}
                        className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0 focus:ring-offset-0 disabled:opacity-50"
                      />
                      แอดมิน (Admin)
                    </label>`;
const addRadioTo = `                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={formRoleType === 'admin'}
                        onChange={() => setFormRoleType('admin')}
                        className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0 focus:ring-offset-0"
                      />
                      แอดมิน (Admin)
                    </label>`;
content = content.replace(addRadioFrom, addRadioTo);

// 5. Revert Edit Modal Radio
const editRadioFrom = `                  <label className={\`flex items-center gap-1.5 text-xs text-slate-300 \${formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}\`}>
                    <input
                      type="radio"
                      checked={formRoleType === 'admin'}
                      onChange={() => setFormRoleType('admin')}
                      disabled={formEmpPrefix !== 'ADM' && formEmpPrefix !== 'EMP'}
                      className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0 disabled:opacity-50"
                    />
                    แอดมิน (Admin)
                  </label>`;
const editRadioTo = `                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      checked={formRoleType === 'admin'}
                      onChange={() => setFormRoleType('admin')}
                      className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0"
                    />
                    แอดมิน (Admin)
                  </label>`;
content = content.replace(editRadioFrom, editRadioTo);

fs.writeFileSync('app/admin/employees/page.tsx', content, 'utf-8');
console.log('Successfully reverted page.tsx');
