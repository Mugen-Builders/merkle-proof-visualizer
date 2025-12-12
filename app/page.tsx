"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, http, keccak256 } from 'viem';
import { mainnet } from 'viem/chains';
import TransactionInput from "./components/TransactionInput";
import TreeHeightControl from "./components/TreeHeightControl";
import ZoomControl from "./components/ZoomControl";
import Diagram from "./components/Diagram";
import SignerControl from "./components/SignerControl";
import { DecodedData } from "./types";

/**
 * Merkle Proof Diagram – interactive React page
 *
 * - Visualizes a Merkle inclusion proof similar to the provided sketch
 * - Controls for tree height and left/right orientation of each proof step
 * - Clean Tailwind UI, SVG rendering
 */

// ---- Helpers ---------------------------------------------------------------
const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

function makeDefaultPattern(h: number): boolean[] {
  // Alternate: top sibling on the left, then right, etc.
  return Array.from({ length: h }, (_, i) => i % 2 === 0);
}

// Generate layout for the diagram
function useLayout({ height, pattern, proof, finalState }: { height: number; pattern: boolean[]; proof: string[]; finalState: string }): {
  nodes: { id: string; label: string; x: number; y: number }[];
  links: { from: string; to: string }[];
  dims: {
    minX: number;
    minY: number;
    width: number;
    height: number;
    NODE_W: number;
    NODE_H: number;
    RADIUS: number;
  };
} {
  // layout constants
  const X_STEP = 90; // horizontal distance between levels along the main path
  const Y_STEP = 120; // vertical distance between levels
  const X_SIBLING = 180; // lateral offset for sibling nodes
  const NODE_W = 116;
  const NODE_H = 54;
  const RADIUS = 12;

  const nodes = []; // { id, label, x, y }
  const links = []; // { from, to }

  // path nodes from root (level 0) down to final (level H)
  for (let level = 0; level <= height; level++) {
    const id = `path-${level}`;
    const label = level === 0 ? "root" : level === height ? finalState : ""; // Set final node label to finalState only
    nodes.push({ id, label, x: level * X_STEP, y: level * Y_STEP });

    if (level > 0) {
      // connect parent -> current along the right spine
      links.push({ from: `path-${level - 1}`, to: id });
    }
  }

  // add sibling proof nodes per level (1..H)
  // proof indices: proof[H-1] near the top, ... proof[0] at the bottom
  for (let level = 1; level <= height; level++) {
    const proofIndex = height - level;
    const siblingIsLeft = !!pattern[level - 1];
    const parentId = `path-${level - 1}`;
    const pathId = `path-${level}`;

    const sx = level * X_STEP + (siblingIsLeft ? -X_SIBLING : X_SIBLING);
    const sy = level * Y_STEP;

    const sid = `sib-${level}`;
    const label = proof[proofIndex] || `proof[${proofIndex}]`; // Use actual proof value if available

    nodes.push({ id: sid, label, x: sx, y: sy });

    // connect parent -> children (sibling and path node)
    links.push({ from: parentId, to: sid });
    links.push({ from: parentId, to: pathId });
  }

  // compute overall bounds for the SVG viewBox
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs) - (NODE_W + 40);
  const maxX = Math.max(...xs) + (NODE_W + 40);
  const minY = Math.min(...ys) - (NODE_H + 40);
  const maxY = Math.max(...ys) + (NODE_H + 40);

  return {
    nodes,
    links,
    dims: {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY,
      NODE_W,
      NODE_H,
      RADIUS,
    },
  };
}

// ---- Page -----------------------------------------------------------------
export default function MerkleProofPage() {
  const [height, setHeight] = useState(6); // number of proof elements
  const [pattern, setPattern] = useState(Array.from({ length: 6 }, () => true));
  const [zoom, setZoom] = useState(1); // Zoom level
  const [decodedData, setDecodedData] = useState<DecodedData | null>(null); // Decoded transaction data
  const [nodes, setNodes] = useState<{ id: string; label: string; x: number; y: number }[]>([]); // Add state for nodes

  // keep pattern length in sync with height
  const normalizedPattern = useMemo(() => {
    let p = pattern.slice(0, height);
    if (p.length < height) {
      p = p.concat(makeDefaultPattern(height).slice(p.length));
    }
    return p;
  }, [pattern, height]);

  const { nodes: layoutNodes, links, dims } = useLayout({
    height,
    pattern: normalizedPattern,
    proof: decodedData?.proof || [],
    finalState: decodedData?.finalState || "",
  });

  useEffect(() => {
    // Calculate Merkle tree path values if we have decoded proof data
    if (decodedData?.proof && decodedData.proof.length > 0 && decodedData.finalState) {
      const proof = decodedData.proof;
      let node = Buffer.from(decodedData.finalState.slice(2), "hex");
      const updatedNodes = [...layoutNodes];

      for (let i = 0; i < proof.length - 1; i++) {
        const sibling = Buffer.from(proof[i].slice(2), "hex");
        node = Buffer.from(keccak256(Buffer.concat([sibling, node])).slice(2), "hex");

        const pathNodeId = `path-${proof.length - 1 - i}`;
        const pathNode = updatedNodes.find((n) => n.id === pathNodeId);

        if (pathNode) {
          pathNode.label = "0x" + node.toString("hex");
        }
      }

      setNodes(updatedNodes);
    } else {
      setNodes(layoutNodes);
    }
  }, [height, normalizedPattern, decodedData]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Merkle Proof Visualizer</h1>
            <p className="text-sm text-gray-600">
              A simple, interactive diagram that shows how a Merkle inclusion proof climbs from a leaf
              (<span className="font-medium">final</span>) to the <span className="font-medium">root</span> using the proof elements.
            </p>
          </div>
        </header>

        {/* Transaction Hash Input */}
        <TransactionInput
          onZero={() => {
            const newHeight = 48;
            const zeroHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
            const newProof = Array.from({ length: newHeight }, () => zeroHash);
            const newFinalState = zeroHash;

            setHeight(newHeight);
            setPattern(Array.from({ length: newHeight }, () => true));
            setDecodedData({
              proof: newProof,
              finalState: newFinalState,
            });
          }}
          onDecode={(decoded) => {
            setDecodedData(decoded);
            console.log("Decoded transaction data:", decoded);

            if (decoded && decoded.proof) {
              const proof = decoded.proof;
              if (Array.isArray(proof) && proof.length > 0) {
                setPattern(proof.map(() => true)); // Use the proof length to set the pattern
                setHeight(proof.length); // Set the height based on the proof length
              } else {
                console.error("Proof data is not a valid array or is empty.");
              }
            } else {
              console.error("Decoded arguments are invalid or missing.");
            }
          }}
        />

        {/* Controls */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TreeHeightControl height={height} setHeight={(newHeight) => {
            setHeight(newHeight);
            setPattern(Array.from({ length: newHeight }, () => true));
          }} />

  
          <ZoomControl zoom={zoom} setZoom={setZoom} />

          <SignerControl
            nodes={nodes}
            onSign={(contractAddress) => {
              console.log("Signing transaction for contract:", contractAddress);
              // Add signing logic here
            }}
          />
        </div>
        <Diagram
          nodes={nodes}
          setNodes={setNodes}
          links={links}
          dims={dims}
          zoom={zoom}
          setZoom={setZoom}
          height={height}
        />
  
        <footer className="mt-6 text-center text-xs text-gray-500">
          Tip: proof elements are ordered bottom-up: proof[0] pairs with the leaf (final), proof[H-1] is near the root.
        </footer>
      </div>
    </div>
  );
}
