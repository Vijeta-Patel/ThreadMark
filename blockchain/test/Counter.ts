
import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("GarmentPassport", function () {
  async function deployPassport() {
    const passport = await ethers.deployContract("GarmentPassport");
    await passport.waitForDeployment();
    return passport;
  }

  it("registers a garment and returns its data", async function () {
    const passport = await deployPassport();
    const [registrant] = await ethers.getSigners();
    const pid = "TM-001";
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes("garment metadata"));

    await passport.registerGarment(pid, dataHash);

    const [storedHash, timestamp, storedRegistrant] =
      await passport.getGarment(pid);

    expect(storedHash).to.equal(dataHash);
    expect(timestamp).to.be.greaterThan(0n);
    expect(storedRegistrant).to.equal(registrant.address);
  });

  it("rejects an empty product ID", async function () {
    const passport = await deployPassport();
    const dataHash = ethers.ZeroHash;

    await expect(
      passport.registerGarment("", dataHash),
    ).to.be.revertedWith("pid required");
  });

  it("rejects duplicate product IDs", async function () {
    const passport = await deployPassport();
    const pid = "TM-001";
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes("garment metadata"));

    await passport.registerGarment(pid, dataHash);

    await expect(
      passport.registerGarment(pid, dataHash),
    ).to.be.revertedWith("garment already exists");
  });

  it("returns a zero timestamp for an unknown product ID", async function () {
    const passport = await deployPassport();

    const [storedHash, timestamp, storedRegistrant] =
      await passport.getGarment("UNKNOWN");

    expect(storedHash).to.equal(ethers.ZeroHash);
    expect(timestamp).to.equal(0n);
    expect(storedRegistrant).to.equal(ethers.ZeroAddress);
  });

  it("emits GarmentRegistered with the correct values", async function () {
    const passport = await deployPassport();
    const [registrant] = await ethers.getSigners();
    const pid = "TM-002";
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes("another garment"));

    await expect(passport.registerGarment(pid, dataHash))
      .to.emit(passport, "GarmentRegistered")
      .withArgs(pid, dataHash, registrant.address, (timestamp: bigint) =>
        timestamp > 0n
      );
  });
});
