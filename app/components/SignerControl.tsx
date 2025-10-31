import React, { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { switchChain, createConfig, http } from '@wagmi/core'
import { mainnet, sepolia } from '@wagmi/core/chains'
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface SignerControlProps {
  nodes: { id: string; label: string; x: number; y: number }[]; // Pass nodes as a prop
  onSign: (contractAddress: string) => void;
}

const SignerControl: React.FC<SignerControlProps> = ({ nodes, onSign }) => {
  const [contractAddress, setContractAddress] = useState("");
  const [network, setNetwork] = useState("ethereum");
  const { isConnected } = useAccount();

  const { writeContract } = useWriteContract();

  const config = createConfig({
    chains: [mainnet],
    transports: {
        [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/hr7r2ANATPNHZti1Ip82GDfrrwPiR6Pl'),
    },
    })

  const handleSign = async () => {
    if (!contractAddress) {
      alert("Please enter a contract address.");
      return;
    }

    if (!isConnected) {
      alert("No wallet connected. Please connect your wallet.");
      return;
    }

    try {
      // Extract proof, finalState, left, and right from the nodes
      const proof = nodes.filter((n) => n.id.startsWith("sib-")).map((n) => n.label);
      const finalState = nodes.filter((n) => n.id.startsWith("path-")).at(-1)?.label; // Get the last element that starts with 'path-'
      const left = nodes.find((n) => n.id.startsWith("sib-1"))?.label;
      const right = nodes.find((n) => n.id.startsWith("path-1"))?.label;

      if (!finalState || !left || !right) {
        alert("Missing required values (finalState, left, or right).");
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
                },
            ],
          address: contractAddress as `0x${string}`,
          functionName: 'joinTournament',
          args: [finalState, proof, left, right],
       });

    } catch (error) {
      console.error("Error signing transaction:", error);
      alert("Failed to sign the transaction. Check the console for details.");
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
            className="mt-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Sign Transaction
          </button>
        </>
      )}
    </div>
  );
};

export default SignerControl;