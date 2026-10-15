import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("GarmentPassport", function () {
  const samplePid = "TM-7K3QX9PD2A";
  const sampleHash = "0x65c56b8b182f23a89cfd6ccd5c3f0cda8bf2d955ec6ca1a20fa4f94dd41db19b";

  it("registers a garment, stores dataHash, timestamp, and registrant, and emits GarmentRegistered event", async function () {
    const [deployer] = await ethers.getSigners();
    const garmentPassport = await ethers.deployContract("GarmentPassport");

    const tx = await garmentPassport.registerGarment(samplePid, sampleHash);
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt!.blockNumber);

    await expect(tx)
      .to.emit(garmentPassport, "GarmentRegistered")
      .withArgs(samplePid, sampleHash, deployer.address, block!.timestamp);

    const [storedHash, storedTimestamp, storedRegistrant] = await garmentPassport.getGarment(samplePid);
    expect(storedHash).to.equal(sampleHash);
    expect(storedTimestamp).to.equal(block!.timestamp);
    expect(storedRegistrant).to.equal(deployer.address);
  });

  it("reverts with 'pid required' on empty PID", async function () {
    const garmentPassport = await ethers.deployContract("GarmentPassport");
    await expect(garmentPassport.registerGarment("", sampleHash)).to.be.revertedWith("pid required");
  });

  it("reverts with 'garment already exists' on duplicate PID", async function () {
    const garmentPassport = await ethers.deployContract("GarmentPassport");
    await garmentPassport.registerGarment(samplePid, sampleHash);

    await expect(garmentPassport.registerGarment(samplePid, sampleHash)).to.be.revertedWith(
      "garment already exists"
    );
  });

  it("returns timestamp 0 and empty data for unknown PID without reverting", async function () {
    const garmentPassport = await ethers.deployContract("GarmentPassport");
    const [storedHash, storedTimestamp, storedRegistrant] = await garmentPassport.getGarment("UNKNOWN-PID");

    expect(storedTimestamp).to.equal(0n);
    expect(storedHash).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    expect(storedRegistrant).to.equal("0x0000000000000000000000000000000000000000");
  });

  it("enforces immutability: records cannot be updated or deleted", async function () {
    const garmentPassport = await ethers.deployContract("GarmentPassport");
    await garmentPassport.registerGarment(samplePid, sampleHash);

    // 1. Attempting to update by re-registering with different hash reverts
    const newHash = "0x82fe61beb991396f19cf6995c50a05b7ac455e7cf8892a6507ce86f2b7b70b52";
    await expect(garmentPassport.registerGarment(samplePid, newHash)).to.be.revertedWith(
      "garment already exists"
    );

    // 2. Original record remains unaltered
    const [storedHash] = await garmentPassport.getGarment(samplePid);
    expect(storedHash).to.equal(sampleHash);

    // 3. Contract interface does not expose update or delete functions
    const contractInterface = garmentPassport.interface;
    const functionNames = contractInterface.fragments
      .filter((f) => f.type === "function")
      .map((f) => f.name);

    expect(functionNames).to.have.members(["registerGarment", "getGarment"]);
    expect(functionNames).to.not.include.members(["updateGarment", "deleteGarment", "modifyGarment"]);
  });
});