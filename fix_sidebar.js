const fs = require('fs');

let content = fs.readFileSync('app/components/AdminSidebar.tsx', 'utf8').replace(/\r\n/g, '\n');

// 1. Update React imports
content = content.replace(
  "import React, { useTransition } from 'react';",
  "import React, { useTransition, useState, useEffect } from 'react';"
);

// 2. Import getPendingLeavesCountAction
content = content.replace(
  "import { ThemeToggle } from './ThemeToggle';",
  "import { ThemeToggle } from './ThemeToggle';\nimport { getPendingLeavesCountAction } from '../actions/leaves';"
);

// 3. Add state and useEffect inside the component
const stateAndEffect = `  const [isTransitioning, startTransition] = useTransition();
  const isLoading = isPending || isTransitioning;
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function loadCount() {
      try {
        const count = await getPendingLeavesCountAction();
        setPendingCount(count);
      } catch (err) {}
    }
    loadCount();
    // Optional: Set an interval to refresh the count every minute
    const interval = setInterval(loadCount, 60000);
    return () => clearInterval(interval);
  }, []);`;

content = content.replace(
  "  const [isTransitioning, startTransition] = useTransition();\n  const isLoading = isPending || isTransitioning;",
  stateAndEffect
);

// 4. Update the link rendering to show the badge
const oldLinkRender = `            return (
              <a
                key={link.path}
                href={link.path}
                className={\`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition \${isActive ? activeClasses : inactiveClasses}\`}
              >
                {link.icon}
                {link.label}
              </a>
            );`;

const newLinkRender = `            return (
              <a
                key={link.path}
                href={link.path}
                className={\`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition \${isActive ? activeClasses : inactiveClasses}\`}
              >
                <div className="flex items-center gap-3">
                  {link.icon}
                  {link.label}
                </div>
                {link.path === '/admin/leaves' && pendingCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </a>
            );`;

content = content.replace(oldLinkRender, newLinkRender);

fs.writeFileSync('app/components/AdminSidebar.tsx', content);
console.log('Fixed app/components/AdminSidebar.tsx');
