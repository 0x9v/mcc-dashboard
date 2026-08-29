'use client';

import React, { useState } from 'react';

export type InventoryItem = {
  slot: number;
  name: string;
  count: number;
  lore?: string[];
};

interface InventoryGridProps {
  items: InventoryItem[];
  onSlotClick?: (slotIndex: number) => void;
}

export default function InventoryGrid({ items, onSlotClick }: InventoryGridProps) {
  const [hoveredItem, setHoveredItem] = useState<InventoryItem | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const getItemAtSlot = (slotIdx: number) => {
    return items.find((item) => item.slot === slotIdx);
  };

  const handleMouseMove = (e: React.MouseEvent, item?: InventoryItem) => {
    if (item) {
      setHoveredItem(item);
      setMousePos({ x: e.clientX + 16, y: e.clientY + 16 });
    } else {
      setHoveredItem(null);
    }
  };

  const renderSlot = (slotIndex: number) => {
    const item = getItemAtSlot(slotIndex);

    return (
      <div
        key={slotIndex}
        onClick={() => onSlotClick && onSlotClick(slotIndex)}
        onMouseMove={(e) => handleMouseMove(e, item)}
        onMouseLeave={() => setHoveredItem(null)}
        className="mc-slot flex items-center justify-center relative cursor-pointer"
      >
        {item && (
          <div className="w-full h-full relative pointer-events-none p-1">
            {/* Placeholder Sprite */}
            <div className="w-full h-full bg-indigo-500/40 border-2 border-indigo-500/60 rounded-sm"></div>
            
            {/* Item Count */}
            {item.count > 1 && (
              <span className="absolute -bottom-1 -right-0.5 text-lg font-bold text-white drop-shadow-[2px_2px_0px_#3f3f3f]">
                {item.count}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mc-panel p-4 inline-block rounded-none text-neutral-800">
      <h3 className="text-xl font-bold mb-2">Inventory</h3>
      
      <div className="grid grid-cols-9 gap-0.5 w-fit mb-2">
        {Array.from({ length: 27 }).map((_, i) => renderSlot(i))}
      </div>

      <div className="grid grid-cols-9 gap-0.5 w-fit mt-3 pt-3 border-t-2 border-[#555555]">
        {Array.from({ length: 9 }).map((_, i) => renderSlot(i + 27))}
      </div>

      {hoveredItem && (
        <div
          className="fixed mc-tooltip text-white p-2 rounded-none pointer-events-none z-50 text-sm shadow-2xl"
          style={{ top: mousePos.y, left: mousePos.x }}
        >
          <p className="font-bold text-yellow-300">{hoveredItem.name}</p>
          {hoveredItem.lore && hoveredItem.lore.map((line, idx) => (
            <p key={idx} className="text-purple-300">{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}
