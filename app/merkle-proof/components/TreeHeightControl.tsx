import React from "react";

const TreeHeightControl = ({ height, setHeight }: { height: number; setHeight: (value: number) => void }) => {
  return (
    <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
      <label className="block text-sm font-medium mb-2">Tree Height</label>
      <input
        type="range"
        min="1"
        max="48"
        value={height}
        onChange={(e) => setHeight(Number(e.target.value))}
        className="w-full"
      />
      <div className="mt-2 text-sm">Height: {height}</div>
    </div>
  );
};

export default TreeHeightControl;