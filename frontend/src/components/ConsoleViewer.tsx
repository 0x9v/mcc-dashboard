'use client';

import { useEffect, useState, useRef } from 'react';

export default function ConsoleViewer({ instanceName }: { instanceName: string }) {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    // Poll the backend every 2 seconds for new terminal lines
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/console/${instanceName}`, {
          headers: { 'x-api-key': 'operator_v6_secure' }
        });
        const data = await res.json();
        if (data.lines) {
          setLogs(data.lines);
        }
      } catch (err) {
        console.error('Failed to fetch console logs');
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [instanceName]);

  // Auto-scroll to the bottom whenever new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="mc-panel p-4 mt-8 rounded-none">
      <h3 className="text-xl font-bold mb-2">Live Console: {instanceName}</h3>
      <pre 
        ref={scrollRef}
        className="bg-[#100010] text-gray-300 p-4 h-64 overflow-y-auto text-sm border-2 border-[#555555] whitespace-pre-wrap font-mono"
      >
        {logs.length === 0 ? 'Waiting for output...' : logs.join('\n')}
      </pre>
    </div>
  );
}
