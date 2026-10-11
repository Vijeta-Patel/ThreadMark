import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("GarmentPassportModule", (m) => {
  const garmentPassport = m.contract("GarmentPassport");

  return { garmentPassport };
});