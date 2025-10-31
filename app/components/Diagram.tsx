import React from "react";
import DiagramNode from "./DiagramNode";
import DiagramLink from "./DiagramLink";
import { keccak256 } from "viem/utils";

interface DiagramProps {
  nodes: { id: string; label: string; x: number; y: number }[];
  links: { from: string; to: string }[];
  dims: {
    minX: number;
    minY: number;
    width: number;
    height: number;
  };
  zoom: number;
  setZoom: (value: number) => void;
  height: number;
  setNodes: (nodes: { id: string; label: string; x: number; y: number }[]) => void;
}

const Diagram: React.FC<DiagramProps> = ({ nodes, links, height, dims, zoom, setZoom, setNodes }) => {
  const nodeById = React.useMemo(() => {
    const map = new Map();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const updateNodeLabel = (nodeId: string, newLabel: string) => {
    const updatedNodes = nodes.map((node) =>
      node.id === nodeId ? { ...node, label: newLabel } : node
    );

    // Calculate values for right nodes (path-x nodes except the last one)
    let node = Buffer.from(updatedNodes[height].label.slice(2), "hex");

    for (let i = 0; i < height - 1; i++) {
        const pathSibId = `sib-${height - i}`;
        const pathSib = updatedNodes.find((n) => n.id === pathSibId);

        const sibling = Buffer.from(pathSib!.label.slice(2), "hex");
        node = Buffer.from(keccak256(Buffer.concat([sibling, node])).slice(2), "hex");

        // Find the corresponding path-x node and update its label
        const pathNodeId = `path-${height - 1 - i}`;
        const pathNode = updatedNodes.find((n) => n.id === pathNodeId);

        if (pathNode) {
            pathNode.label = "0x" + node.toString("hex");
        }
    }

    setNodes(updatedNodes);
  };

  return (
    <div
      className="overflow-auto rounded-2xl border bg-white p-4 shadow-sm"
      style={{ maxHeight: "48rem", height: "48rem", cursor: "grab" }}
      onMouseDown={(e) => {
        const container = e.currentTarget;
        container.style.cursor = "grabbing";
        const startX = e.clientX;
        const startY = e.clientY;
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;

        const onMouseMove = (moveEvent: MouseEvent) => {
          container.scrollLeft = scrollLeft - (moveEvent.clientX - startX);
          container.scrollTop = scrollTop - (moveEvent.clientY - startY);
        };

        const onMouseUp = () => {
          container.style.cursor = "grab";
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      }}
    >
      <div
        style={{ width: `${dims.width * zoom}px`, height: `${dims.height * zoom}px` }}
      >
        <svg
          viewBox={`${dims.minX} ${dims.minY} ${dims.width} ${dims.height}`}
          className="h-full w-full"
        >
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L6,3 z" className="fill-gray-400" />
            </marker>
          </defs>

          {links.map((lnk, i) => (
            <DiagramLink
              key={i}
              sourceX={nodeById.get(lnk.from)?.x || 0}
              sourceY={nodeById.get(lnk.from)?.y || 0}
              targetX={nodeById.get(lnk.to)?.x || 0}
              targetY={nodeById.get(lnk.to)?.y || 0}
            />
          ))}

          {nodes.map((n, currentIndex) => {
            const parentNode = links.find((link) => link.to === n.id)?.from;
            const parentX = parentNode ? nodeById.get(parentNode)?.x : null;
            const isLeftChild = parentX !== null && n.x < parentX;
            const fillColor = isLeftChild ? "white" : "whitesmoke"; 

            const nodeIndex = nodes.length - 1 - currentIndex;
            const isFinalNode = nodeIndex === height; // Check if the node index matches the proof size

            const handleClick = (node: { id: string; label: string; x: number; y: number }) => {
              if (isLeftChild || isFinalNode) { // Allow editing for left child nodes and the final node
                const newValue = prompt("Enter new value for this node:", node.label);
                if (newValue) {
                  updateNodeLabel(node.id, newValue);
                }
              }
            };

            return (
              <DiagramNode
                key={n.id}
                x={n.x}
                y={n.y}
                label={n.label}
                index={nodes.length - 1 - currentIndex} // Reverse the index numbering
                fillColor={fillColor} // Pass the color to DiagramNode
                onClick={() => handleClick(n)} // Pass the node to the click handler
                isFinalNode={isFinalNode} // Pass the final node flag
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default Diagram;