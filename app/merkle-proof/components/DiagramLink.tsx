import React from "react";

interface DiagramLinkProps {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

const DiagramLink: React.FC<DiagramLinkProps> = ({ sourceX, sourceY, targetX, targetY }) => {
  return (
    <line
      x1={sourceX}
      y1={sourceY}
      x2={targetX}
      y2={targetY}
      stroke="black"
      strokeWidth={1}
    />
  );
};

export default DiagramLink;