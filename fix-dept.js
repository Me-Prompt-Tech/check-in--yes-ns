const fs = require('fs');
let code = fs.readFileSync('app/admin/departments/page.tsx', 'utf8');

// The `replace_file_content` messed up, let's restore it exactly.
// I will just use regex to clean up everything between the map `))` and the `Prefix Section`

const prefixStartMarker = '{/* ------------------------------------------- */}\r\n        {/* PREFIX SECTION */}';
const prefixStartMarkerLF = '{/* ------------------------------------------- */}\n        {/* PREFIX SECTION */}';

let marker = code.includes(prefixStartMarker) ? prefixStartMarker : prefixStartMarkerLF;

// Find the map end:
//                 </div>
//               </div>
//             ))
// And replace everything from `))` up to `marker` with the correct else block.

const correctElseBlock = `          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
              <svg className="w-12 h-12 mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              <p>ไม่พบแผนกที่ค้นหา</p>
            </div>
          )}
        </div>

        `;

// we need to be careful with the regex
code = code.replace(/\}\)\)[\s\S]*?(?=\{\/\* ------------------------------------------- \*\/)/, '}))\n' + correctElseBlock);

fs.writeFileSync('app/admin/departments/page.tsx', code);
console.log('Fixed file.');
