import React from "react";

const DiagramNode = ({
  label,
  x,
  y,
  index,
  fillColor,
  onClick,
  isFinalNode,
}: {
  label: string;
  x: number;
  y: number;
  index?: number;
  fillColor?: string;
  onClick?: () => void;
  isFinalNode?: boolean;
}) => {
  // Truncate long hashes for better display
  const truncatedLabel = label.length > 15 ? `${label.slice(0, 6)}...${label.slice(-4)}` : label;

  return (
    <g transform={`translate(${x}, ${y})`} onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <rect
        x="-58"
        y="-40" // Adjusted to center the taller rectangle
        width="116"
        height="80" // Increased height to fit two lines of text
        rx="12"
        className="stroke-gray-300 shadow-sm"
        fill={isFinalNode ? "white" : fillColor || "white"} // Final node is always white

      />
      {(
        <>
          {label && label.startsWith("0x") && (
            <text
              textAnchor="middle"
              alignmentBaseline="central"
              className="fill-gray-900 text-sm font-medium"
              y="-10" // Position the first line slightly above center
            >
              { (!isFinalNode && fillColor == "white") && ( <> proof[{index}] </> )}
              { isFinalNode && ( <> final </> )}
            </text>
          )}
          {label && (
            <text
              textAnchor="middle"
              alignmentBaseline="central"
              className="fill-gray-900 text-sm font-medium"
              y="15" // Position the second line slightly below center
            >
              <title>{label}</title> {/* Show full text on mouseover */}
              {truncatedLabel}
            </text>
          )}
        </>
      )}
    </g>
  );
};

export default DiagramNode;