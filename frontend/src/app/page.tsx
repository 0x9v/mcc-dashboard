'use client';

import { useEffect, useState } from 'react';
import { VT323 } from 'next/font/google';
import InventoryGrid, { InventoryItem } from '@/components/InventoryGrid';
import ConsoleViewer from '@/components/ConsoleViewer'; // Imported here!

const vt323 = VT323({ weight: '400', subsets: ['latin'] });

type Instance = {
  name: string;
  status: string;
};

export default function Dashboard() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [activeInstance, setActiveInstance] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/instances', { headers: { 'x-api-key': 'operator_v6_secure' } })
      .then((res) => res.json())
      .then((data) => {
        setInstances(data.instances);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch instances:', err);
        setLoading(false);
      });
  }, []);

  const toggleInstance = async (instanceName: string, currentStatus: string) => {
    const action = currentStatus === 'active' ? 'stop' : 'start';
    try {
      await fetch(`/api/instances/${instanceName}/${action}`, { 
        method: 'POST',
        headers: { 'x-api-key': 'operator_v6_secure' }
      });
      
      const res = await fetch('/api/instances', { headers: { 'x-api-key': 'operator_v6_secure' } });
      const data = await res.json();
      setInstances(data.instances);
    } catch (err) {
      console.error(`Failed to ${action} instance:`, err);
    }
  };

  const loadInventory = async (instanceName: string) => {
    setActiveInstance(instanceName);
    try {
      const res = await fetch(`/api/inventory/${instanceName}`, { headers: { 'x-api-key': 'operator_v6_secure' } });
      const data = await res.json();
      if (data.inventory) {
        setInventory(data.inventory);
      } else {
        console.error('Error fetching inventory:', data.error);
        setInventory([]);
      }
    } catch (err) {
      console.error('Network or server error:', err);
    }
  };

  return (
    <main className={`min-h-screen p-8 ${vt323.className} text-xl antialiased`}>
      <h1 className="text-5xl font-bold mb-8 text-white drop-shadow-[3px_3px_0px_#000]">
        MCC Web Dashboard
      </h1>
      
      {loading ? (
        <p className="text-white drop-shadow-[2px_2px_0px_#000] text-2xl">Loading instances...</p>
      ) : (
        <div className="flex gap-8 items-start">
          
          {/* Sidebar */}
          <div className="flex flex-col gap-4 w-64">
            {instances.map((inst) => (
              <div key={inst.name} className="mc-panel p-4">
                <h2 className="text-3xl capitalize font-bold mb-2">
                  {inst.name}
                </h2>
                <p className="text-xl font-bold mb-4">
                  Status:{' '}
                  <span className={inst.status === 'active' ? 'text-[#2a7d2a]' : 'text-[#aa0000]'}>
                    {inst.status.toUpperCase()}
                  </span>
                </p>
                <div className="flex flex-col gap-2">
                  <button 
                    className="mc-btn w-full text-xl flex justify-between"
                    onClick={() => toggleInstance(inst.name, inst.status)}
                  >
                    <span>{inst.status === 'active' ? '⏹ Stop' : '▶ Start'}</span>
                  </button>
                  
                  <button 
                    className={`mc-btn w-full text-xl ${inst.status !== 'active' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => inst.status === 'active' && loadInventory(inst.name)}
                    disabled={inst.status !== 'active'}
                  >
                    🎒 Inventory
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Main View */}
          <div className="flex-1 max-w-4xl">
            <h2 className="text-3xl font-bold mb-4 text-white drop-shadow-[2px_2px_0px_#000]">
              {activeInstance ? `Live View: ${activeInstance}` : 'Select an instance to view'}
            </h2>
            
            {activeInstance && (
              /* Notice how everything is wrapped in this flex column div */
              <div className="flex flex-col gap-6">
                <InventoryGrid 
                  items={inventory} 
                  onSlotClick={(slot) => console.log('Clicked slot:', slot)} 
                />
                
                {/* The new terminal viewer */}
                <ConsoleViewer instanceName={activeInstance} />
              </div>
            )}
          </div>

        </div>
      )}
    </main>
  );
}
