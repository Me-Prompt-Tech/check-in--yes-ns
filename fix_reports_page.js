const fs = require('fs');

let content = fs.readFileSync('app/admin/reports/page.tsx', 'utf8').replace(/\r\n/g, '\n');

// Update TH
content = content.replace(
  '                  <th className="px-6 py-4 font-semibold text-center">เลิกงาน</th>\n                  <th className="px-6 py-4 font-semibold">สถานะ</th>\n                </tr>',
  '                  <th className="px-6 py-4 font-semibold text-center">เลิกงาน</th>\n                  <th className="px-6 py-4 font-semibold">สถานะ</th>\n                  <th className="px-6 py-4 font-semibold">หมายเหตุ</th>\n                </tr>'
);

// Update TD
const oldTd = `                      <td className="px-6 py-4">
                        <span className={\`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border
                          \${log.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                            log.status === 'Late' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                            log.status === 'Absent' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                            log.status === 'On Leave' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'}
                        \`}>
                          {log.status === 'Present' ? 'มาปกติ' : 
                           log.status === 'Late' ? 'สาย' : 
                           log.status === 'Absent' ? 'ขาดงาน' : 
                           log.status === 'On Leave' ? 'ลา' : 
                           log.status === 'Incomplete' ? 'ไม่สมบูรณ์' : log.status}
                        </span>
                      </td>
                    </tr>`;

const newTd = `                      <td className="px-6 py-4">
                        <span className={\`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border
                          \${log.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                            log.status === 'Late' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                            log.status === 'Absent' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                            log.status === 'On Leave' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'}
                        \`}>
                          {log.status === 'Present' ? 'มาปกติ' : 
                           log.status === 'Late' ? 'สาย' : 
                           log.status === 'Absent' ? 'ขาดงาน' : 
                           log.status === 'On Leave' ? 'ลา' : 
                           log.status === 'Incomplete' ? 'ไม่สมบูรณ์' : log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 max-w-[200px] truncate" title={(log as any).earlyLeaveReason || '-'}>
                        {(log as any).earlyLeaveReason ? <span className="text-rose-400">{(log as any).earlyLeaveReason}</span> : '-'}
                      </td>
                    </tr>`;

content = content.replace(oldTd, newTd);

content = content.replace(
  '                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">',
  '                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">'
);

fs.writeFileSync('app/admin/reports/page.tsx', content);
console.log('Fixed app/admin/reports/page.tsx');
