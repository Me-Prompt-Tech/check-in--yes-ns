const fs = require('fs');

let content = fs.readFileSync('app/actions/employees.ts', 'utf8').replace(/\r\n/g, '\n');

// 1. Update fetchAttendanceTodayAction return
content = content.replace(
  "      status: log ? log.status : 'Absent',\n      avatarColor: COLOR_OPTIONS[index % COLOR_OPTIONS.length]\n    };",
  "      status: log ? log.status : 'Absent',\n      earlyLeaveReason: log ? log.earlyLeaveReason : null,\n      avatarColor: COLOR_OPTIONS[index % COLOR_OPTIONS.length]\n    };"
);

// 2. Update fetchEmployeeLogsAction return
content = content.replace(
  "      leaveWork: item.leaveWork,\n      status: item.status === 'Present' ? 'Normal' : item.status === 'Incomplete' ? 'Incomplete' : item.status\n    };",
  "      leaveWork: item.leaveWork,\n      earlyLeaveReason: item.earlyLeaveReason,\n      status: item.status === 'Present' ? 'Normal' : item.status === 'Incomplete' ? 'Incomplete' : item.status\n    };"
);

fs.writeFileSync('app/actions/employees.ts', content);
console.log('Fixed returns in app/actions/employees.ts');
