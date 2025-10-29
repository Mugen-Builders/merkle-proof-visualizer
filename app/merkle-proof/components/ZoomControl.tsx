import React from "react";

const ZoomControl = ({ zoom, setZoom }: { zoom: number; setZoom: (value: number) => void }) => {
  return (
    <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
      <label className="block text-sm font-medium mb-2">Zoom</label>
      <input
        type="range"
        min="0.5"
        max="2"
        step="0.1"
        value={zoom}
        onChange={(e) => setZoom(Number(e.target.value))}
        className="w-full"
      />
      <div className="mt-2 text-sm">Zoom: {zoom.toFixed(1)}</div>
    </div>
  );
};

export default ZoomControl;