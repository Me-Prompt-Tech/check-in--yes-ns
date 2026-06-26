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
  // Check if link already exists to prevent duplicate injections
  if (!content.includes('ลงเวลาทำงาน (ผู้ใช้ทั่วไป)')) {
    content = content.replace(/ออกรายงาน\s*<\/a>/, "ออกรายงาน\n" + newLink);
    fs.writeFileSync(file, content, 'utf8');
  }
});

console.log('Sidebar links injected.');
