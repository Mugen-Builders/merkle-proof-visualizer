import React, { useState } from "react";
import { createPublicClient, http, decodeFunctionData } from "viem";
import { mainnet, sepolia } from "viem/chains";

const TransactionInput = ({ onDecode, onZero }: { onDecode: (decoded: any) => void; onZero: () => void; }) => {
  const [transactionHash, setTransactionHash] = useState("");

  const client = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  const contractABI = [
    {
      inputs: [
        { internalType: "bytes32", name: "_finalState", type: "bytes32" },
        { internalType: "bytes32[]", name: "_proof", type: "bytes32[]" },
        { internalType: "bytes32", name: "_leftNode", type: "bytes32" },
        { internalType: "bytes32", name: "_rightNode", type: "bytes32" },
      ],
      name: "joinTournament",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];

  const decodeTransaction = async (hash: `0x${string}`) => {
    try {
      const transaction = await client.getTransaction({ hash });
      if (transaction && transaction.input) {
        const decoded = decodeFunctionData({
          abi: contractABI,
          data: transaction.input,
        });
        if (decoded && decoded.args) {
          const [finalState, proof, leftNode, rightNode] = decoded.args; // Map positional arguments
          onDecode({
            finalState: finalState || null,
            proof: proof || [],
            leftNode: leftNode || null,
            rightNode: rightNode || null,
          });
        } else {
          console.error("Decoded data or arguments are undefined.");
        }
      } else {
        console.error("Invalid transaction hash or no input data found.");
      }
    } catch (error) {
      console.error("Error decoding transaction:", error);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
      <label className="block text-sm font-medium mb-2">Transaction Hash</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={transactionHash}
          onChange={(e) => setTransactionHash(e.target.value)}
          placeholder="Enter transaction hash"
          className="flex-1 rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => {
            if (transactionHash.startsWith("0x")) {
              decodeTransaction(transactionHash as `0x${string}`);
            } else {
              console.error("Invalid transaction hash format. Must start with 0x.");
            }
          }}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white shadow-sm hover:bg-blue-600"
        >
          Decode
        </button>
        <button
          onClick={onZero}
          className="rounded-lg bg-gray-500 px-4 py-2 text-sm text-white shadow-sm hover:bg-gray-600"
        >
          Blank Input
        </button>
      </div>
    </div>
  );
};

export default TransactionInput;