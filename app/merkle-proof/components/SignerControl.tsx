import React, { useEffect, useState } from "react";
import { createPublicClient, createWalletClient, http, keccak256 } from "viem";
import { mainnet } from "viem/chains";
import { encodeFunctionData } from "viem";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string }) => Promise<any>;
    };
  }
}

interface SignerControlProps {
  nodes: { id: string; label: string; x: number; y: number }[]; // Pass nodes as a prop
  onSign: (contractAddress: string) => void;
}

const SignerControl: React.FC<SignerControlProps> = ({ nodes, onSign }) => {
  const [contractAddress, setContractAddress] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        setWalletConnected(true);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      alert("MetaMask is not installed. Please install it to continue.");
    }
  };

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum?.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletConnected(true);
        }
      });
    }
  }, []);

  const handleSign = async () => {
    if (!contractAddress) {
      alert("Please enter a contract address.");
      return;
    }

    try {
      // Create a wallet client
      const walletClient = createWalletClient({
        chain: mainnet,
        transport: http(),
      });
      console.log(nodes)

      // Extract proof, finalState, left, and right from the nodes
      const proof = nodes.filter((n) => n.id.startsWith("sib-")).map((n) => n.label);
      const finalState = nodes.filter((n) => n.id.startsWith('path-')).at(-1)?.label; // Get the last element that starts with 'path-'
      const left = nodes.find((n) => n.id.startsWith("sib-1"))?.label;
      const right = nodes.find((n) => n.id.startsWith("path-1"))?.label;

      if (!finalState || !left || !right) {
        alert("Missing required values (finalState, left, or right).");
        return;
      }

      // Prepare transaction data
      const data = {
        proof,
        finalState,
        left,
        right,
      };

      console.log("Transaction data:", data);

      // Format the contract address
      const formattedAddress = contractAddress.trim().toLowerCase().startsWith("0x")
        ? contractAddress.trim().toLowerCase()
        : `0x${contractAddress.trim().toLowerCase()}`;

      // Sign the transaction with serialized data
      const account = walletClient.account || "0x0000000000000000000000000000000000000000"; // Use a default address if account is undefined
      const publicClient = createPublicClient({
        chain: mainnet,
        transport: http(),
      });

      const serializedData = encodeFunctionData({
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
        functionName: "joinTournament",
        args: [finalState, proof, left, right],
      });

      const signedTx = await walletClient.signTransaction({
        chain: mainnet, // Specify the chain explicitly
        account: account, // Use the resolved account
        data: serializedData, // Pass the serialized transaction data
      });

      // Send the signed transaction
      const txHash = await walletClient.sendRawTransaction({ serializedTransaction: signedTx }); // Ensure the correct parameter structure

      alert(`Transaction sent! Hash: ${txHash}`);
    } catch (error) {
      console.error("Error signing transaction:", error);
      alert("Failed to sign the transaction. Check the console for details.");
    }
  };

  if (!walletConnected) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-gray-700">Please connect your wallet to proceed.</p>
        <button
          onClick={connectWallet}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="contractAddress" className="text-sm font-medium text-gray-700">
        Contract Address
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
    </div>
  );
};

export default SignerControl;