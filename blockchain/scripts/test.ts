
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

async function main() {
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const privateKey = process.env.SEPOLIA_PRIVATE_KEY;

    if (!rpcUrl || !contractAddress || !privateKey) {
        throw new Error(
            "Missing SEPOLIA_RPC_URL, CONTRACT_ADDRESS, or SEPOLIA_PRIVATE_KEY in .env"
        );
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const abi = [
        "function registerGarment(string pid, bytes32 dataHash) external",
        "function getGarment(string pid) external view returns (bytes32 dataHash, uint256 timestamp, address registrant)",
        "event GarmentRegistered(string pid, bytes32 dataHash, address registrant, uint256 timestamp)"
    ];

    const contract = new ethers.Contract(
        contractAddress,
        abi,
        wallet
    );

    const pid = `TM-TEST-${Date.now()}`;
    const dataHash = ethers.keccak256(
        ethers.toUtf8Bytes("ThreadMark Sepolia integration test")
    );

    console.log("Registering test garment:", pid);

    const tx = await contract.registerGarment(pid, dataHash);
    console.log("Transaction hash:", tx.hash);

    const receipt = await tx.wait(1);
    console.log("Confirmed in block:", receipt?.blockNumber);

    const [storedHash, timestamp, registrant] =
        await contract.getGarment(pid);

    console.log("Hash matches:", storedHash === dataHash);
    console.log("Timestamp:", timestamp.toString());
    console.log("Registrant:", registrant);
    console.log("Sepolia integration test complete!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
