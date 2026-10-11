import { ethers } from "ethers";

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    const signer = await provider.getSigner();

    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    const abi = [
        "function registerGarment(string,string)",
        "function getGarment(string) view returns (string)"
    ];

    const contract = new ethers.Contract(
        contractAddress,
        abi,
        signer
    );

    await contract.registerGarment("GA001", "FabIndia");

    const result = await contract.getGarment("GA001");

    console.log("Brand:", result);
}

main().catch(console.error);