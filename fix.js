const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'app', 'admin');
const filesToUpdate = [
  path.join(adminDir, 'page.tsx'),
  path.join(adminDir, 'departments', 'page.tsx'),
  path.join(adminDir, 'employees', 'page.tsx'),
  path.join(adminDir, 'leaves', 'page.tsx'),
  path.join(adminDir, 'reports', 'page.tsx')
];

const newLink = `            </a>
            <a
              href="/employee"
              className="flex items-center gap-3 px-4 py-3 text-emerald-400 hover:bg-emerald-900/30 hover:text-emerald-300 rounded-lg text-sm font-medium transition mt-4 border border-emerald-500/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ลงเวลาทำงาน (ผู้ใช้ทั่วไป)
            </a>`;

filesToUpdate.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/ออกรายงาน\s*<\/a>/, "ออกรายงาน\n" + newLink);
  fs.writeFileSync(file, content, 'utf8');
});

console.log('Sidebar links injected.');

// Now fix app/admin/employees/page.tsx specifically for the previous changes
let empPage = fs.readFileSync(filesToUpdate[2], 'utf8');

// 1. Password field in Employee interface
empPage = empPage.replace(
  `  roleType?: 'admin' | 'employee';\n}`,
  `  roleType?: 'admin' | 'employee';\n  password?: string;\n}`
);

// 2. newEmp password payload
empPage = empPage.replace(
  `      roleType: formRoleType\n    };`,
  `      roleType: formRoleType,\n      password: formPassword\n    };`
);

// 3. Add Modal Dropdown
empPage = empPage.replace(
  `                    setFormId(\`\${prefix}\${String(count + 1).padStart(3, '0')}\`);\n                  }}\n                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"`,
  `                    setFormId(\`\${prefix}\${String(count + 1).padStart(3, '0')}\`);\n                    if (prefix !== 'EMP' && formRoleType === 'admin') setFormRoleType('employee');\n                  }}\n                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"`
);

// 4. Edit Modal Dropdown (should be the same replace logic, replace global if possible)
// Since we used replace above, let's do it again for the second occurrence
empPage = empPage.replace(
  `                    setFormId(\`\${prefix}\${String(count + 1).padStart(3, '0')}\`);\n                  }}\n                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"`,
  `                    setFormId(\`\${prefix}\${String(count + 1).padStart(3, '0')}\`);\n                    if (prefix !== 'EMP' && formRoleType === 'admin') setFormRoleType('employee');\n                  }}\n                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"`
);

// 5. Add/Edit Role Radio buttons
empPage = empPage.replaceAll(
  `<label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">\n                      <input\n                        type="radio"\n                        checked={formRoleType === 'admin'}`,
  `<label className={\`flex items-center gap-1.5 text-xs \${formEmpPrefix === 'EMP' ? 'text-slate-300 cursor-pointer' : 'text-slate-600 cursor-not-allowed'}\`}>\n                      <input\n                        type="radio"\n                        disabled={formEmpPrefix !== 'EMP'}\n                        checked={formRoleType === 'admin'}`
);

// The edit modal uses slightly different padding/classes
empPage = empPage.replaceAll(
  `<label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">\n                    <input\n                      type="radio"\n                      checked={formRoleType === 'admin'}`,
  `<label className={\`flex items-center gap-1.5 text-xs \${formEmpPrefix === 'EMP' ? 'text-slate-300 cursor-pointer' : 'text-slate-600 cursor-not-allowed'}\`}>\n                    <input\n                      type="radio"\n                      disabled={formEmpPrefix !== 'EMP'}\n                      checked={formRoleType === 'admin'}`
);

// Focus class fix
empPage = empPage.replaceAll(
  `                        className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0 focus:ring-offset-0"`,
  `                        className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0 focus:ring-offset-0 disabled:opacity-50"`
);
empPage = empPage.replaceAll(
  `                      className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0"`,
  `                      className="text-indigo-600 bg-slate-950 border-slate-850 focus:ring-0 disabled:opacity-50"`
);

fs.writeFileSync(filesToUpdate[2], empPage, 'utf8');
console.log('Employees page fixed.');
