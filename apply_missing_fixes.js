const fs = require('fs');

const path = './app/admin/employees/page.tsx';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// 1. init fetch
const init_from = `      // Load departments first, then employees
      try {
        const depts = await fetchDepartmentsAction();
        setDeptOptions(depts);
      } catch (err) {`;

const init_to = `      // Load departments first, then employees
      try {
        const depts = await fetchDepartmentsAction();
        setDeptOptions(depts);
        
        const prefs = await fetchPrefixesAction();
        setPrefixes(prefs);
      } catch (err) {`;

// 2. openAddModal
const add_modal_from = `  const openAddModal = () => {
    setValidationError('');
    setFormId(\`EMP\${String(employees.length + 1).padStart(3, '0')}\`);
    setFormFirstName('');`;

const add_modal_to = `  const openAddModal = () => {
    setValidationError('');
    const defaultPrefix = prefixes.length > 0 ? prefixes[0].prefix : 'EMP';
    setFormEmpPrefix(defaultPrefix);
    setFormId(\`\${defaultPrefix}\${String(employees.length + 1).padStart(3, '0')}\`);
    setFormFirstName('');`;

if (content.includes(init_from)) {
  content = content.replace(init_from, init_to);
  console.log("Applied init");
} else {
  console.log("Failed init");
}

if (content.includes(add_modal_from)) {
  content = content.replace(add_modal_from, add_modal_to);
  console.log("Applied add_modal");
} else {
  console.log("Failed add_modal");
}

fs.writeFileSync(path, content);
console.log("Done");
