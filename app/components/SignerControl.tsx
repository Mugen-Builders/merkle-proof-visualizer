import React, { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { ConnectButton } from "@rainbow-me/rainbowkit";

// ABI for tournament read functions
const tournamentReadABI = [
  {
    name: "isFinished",
    type: "function",
    inputs: [],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    name: "isClosed",
    type: "function",
    inputs: [],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    name: "bondValue",
    type: "function",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

// Create a Sepolia client for reading contract state
const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

interface SignerControlProps {
  nodes: { id: string; label: string; x: number; y: number }[]; // Pass nodes as a prop
  onSign: (contractAddress: string) => void;
}

const SignerControl: React.FC<SignerControlProps> = ({ nodes, onSign }) => {
  const [contractAddress, setContractAddress] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const { isConnected } = useAccount();

  const { writeContract } = useWriteContract();

  const handleSign = async () => {
    if (!contractAddress) {
      alert("Please enter a contract address.");
      return;
    }

    if (!isConnected) {
      alert("No wallet connected. Please connect your wallet.");
      return;
    }

    setIsChecking(true);
    
    try {
      // Check tournament status before proceeding
      console.log("=== Checking Tournament Status ===");
      
      const [isFinished, isClosed, bondValue] = await Promise.all([
        sepoliaClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: tournamentReadABI,
          functionName: 'isFinished',
        }),
        sepoliaClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: tournamentReadABI,
          functionName: 'isClosed',
        }),
        sepoliaClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: tournamentReadABI,
          functionName: 'bondValue',
        }),
      ]);

      console.log("Tournament isFinished:", isFinished);
      console.log("Tournament isClosed:", isClosed);
      console.log("Tournament bondValue:", bondValue.toString(), "wei");

      if (isFinished) {
        alert("❌ Tournament is FINISHED. You cannot join a finished tournament.");
        setIsChecking(false);
        return;
      }

      if (isClosed) {
        alert("❌ Tournament is CLOSED. You cannot join a closed tournament.");
        setIsChecking(false);
        return;
      }

      console.log("✅ Tournament is active. Proceeding with transaction...");
      console.log("==================================");

      // Extract proof, finalState, left, and right from the nodes
      const proof = nodes.filter((n) => n.id.startsWith("sib-")).map((n) => n.label as `0x${string}`);
      const finalState = nodes.filter((n) => n.id.startsWith("path-")).at(-1)?.label as `0x${string}` | undefined;
      const left = nodes.find((n) => n.id === "sib-1")?.label as `0x${string}` | undefined;
      const right = nodes.find((n) => n.id === "path-1")?.label as `0x${string}` | undefined;

      // Debug logging
      console.log("=== Transaction Debug ===");
      console.log("Contract Address:", contractAddress);
      console.log("All Nodes:", nodes);
      console.log("Sibling Nodes (unsorted):", nodes.filter((n) => n.id.startsWith("sib-")).map((n) => ({ id: n.id, label: n.label })));
      console.log("Path Nodes:", nodes.filter((n) => n.id.startsWith("path-")).map((n) => ({ id: n.id, label: n.label })));
      console.log("---");
      console.log("Proof Array:", proof);
      console.log("Proof Length:", proof.length);
      console.log("FinalState:", finalState);
      console.log("Left Node (sib-1):", left);
      console.log("Right Node (path-1):", right);
      console.log("Bond Value (wei):", bondValue.toString());
      console.log("=========================");

      if (!finalState || !left || !right) {
        alert("Missing required values (finalState, left, or right).");
        setIsChecking(false);
        return;
      }

      // Write the contract
      await writeContract({ 
          abi: [
                {
                    name: "joinTournament",
                    type: "function",
                    inputs: [
                      { name: "_finalState", type: "bytes32" },
                      { name: "_proof", type: "bytes32[]" },
                      { name: "_leftNode", type: "bytes32" },
                      { name: "_rightNode", type: "bytes32" },
                    ],
                    outputs: [],
                    stateMutability: "payable",
                },
            ],
          address: contractAddress as `0x${string}`,
          functionName: 'joinTournament',
          args: [finalState, proof, left, right],
          value: bondValue,
       });

      setIsChecking(false);
    } catch (error) {
      console.error("Error signing transaction:", error);
      alert("Failed to sign the transaction. Check the console for details.");
      setIsChecking(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {!isConnected ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-gray-700">Please connect your wallet to proceed.</p>
          <ConnectButton />
        </div>
      ) : (
        <>
          <label htmlFor="contractAddress" className="text-sm font-medium text-gray-700">
            Tournament Contract Address
          </label>
          <input
            id="contractAddress"
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="Enter contract address"
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <button
            onClick={handleSign}
            disabled={isChecking}
            className="mt-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChecking ? "Checking Tournament..." : "Sign Transaction"}
          </button>
        </>
      )}
    </div>
  );
};

export default SignerControl;