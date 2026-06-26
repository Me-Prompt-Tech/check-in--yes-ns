const fs = require('fs');
let code = fs.readFileSync('app/admin/departments/page.tsx', 'utf8');

const correctEnd = `                  <button onClick={() => openEditModal(dept)} className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition">
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
        {/* PREFIX SECTION */}`;

const startStr = '<button onClick={() => openEditModal(dept)} className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition">';
const endStr = '{/* PREFIX SECTION */}';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex > -1 && endIndex > -1) {
  const before = code.substring(0, startIndex);
  const after = code.substring(endIndex + endStr.length);
  const fixedCode = before + correctEnd.replace('{/* PREFIX SECTION */}', '') + endStr + after;
  fs.writeFileSync('app/admin/departments/page.tsx', fixedCode);
  console.log('Fixed syntax error!');
} else {
  console.log('Strings not found', startIndex, endIndex);
}
