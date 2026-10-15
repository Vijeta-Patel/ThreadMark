import { ethers } from "ethers";
import GarmentPassportAbi from "../abi/GarmentPassport.json";

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const signer = await provider.getSigner();

    const contractAddress = process.env.CONTRACT_ADDRESS ?? "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const contract = new ethers.Contract(contractAddress, GarmentPassportAbi, signer);

    const samplePid = "GA001";
    const sampleHash = "0x65c56b8b182f23a89cfd6ccd5c3f0cda8bf2d955ec6ca1a20fa4f94dd41db19b";

    const tx = await contract.registerGarment(samplePid, sampleHash);
    await tx.wait(1);

    const [dataHash, timestamp, registrant] = await contract.getGarment(samplePid);
    console.log("Registered garment on local chain:");
    console.log("  PID:", samplePid);
    console.log("  Hash:", dataHash);
    console.log("  Timestamp:", Number(timestamp));
    console.log("  Registrant:", registrant);
}

main().catch(console.error);