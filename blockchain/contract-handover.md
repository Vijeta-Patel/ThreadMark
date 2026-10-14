# ThreadMark — Smart Contract Handover

## 1. Contract Details

- **Contract name:** `GarmentPassport`
- **Network:** Ethereum Sepolia testnet
- **Chain ID:** `11155111`
- **Contract address:** `0xF0d9E12561e14d8b5E64a5a21A6305F089FCa75f`
- **Deployment status:** Successfully deployed
- **ABI file:** `blockchain/abi/GarmentPassport.json`

## 2. Transaction Details

- **Deployment transaction:** `0xacbbad81e3afbe1b492d5fbd2f9097f33f585ab028289adf5d3659de33a2d903`
- **Explorer:** https://sepolia.etherscan.io/address/0xF0d9E12561e14d8b5E64a5a21A6305F089FCa75f

## 3. Contract Functions

### Register a garment

`registerGarment(string pid, bytes32 dataHash)`

Registers a garment using its product ID and metadata hash.

- `pid`: Unique, non-empty product ID.
- `dataHash`: SHA-256 or other agreed metadata hash encoded as `bytes32`.
- Duplicate product IDs revert with `"garment already exists"`.
- Empty product IDs revert with `"pid required"`.

The team must agree on the metadata hashing and encoding convention before integrating the frontend and backend.

### Retrieve a garment

`getGarment(string pid)`

Returns:

- `dataHash` — stored metadata hash.
- `timestamp` — registration timestamp.
- `registrant` — wallet address that registered the garment.

For an unknown product ID, `timestamp` is `0`.

## 4. Event

`GarmentRegistered(string pid, bytes32 dataHash, address registrant, uint256 timestamp)`

Emitted when a garment is successfully registered.

## 5. Frontend Integration Notes

- Use the contract address and ABI listed above.
- Sepolia chain ID: `11155111`.
- Use ethers.js v6 for blockchain interactions.
- Wait for one transaction confirmation before reporting registration as successful.
- Keep `CHAIN_MODE=mock` until real-chain integration is implemented and tested.
- Never expose private keys or recovery phrases in frontend code.
- The frontend should read the contract address from configuration rather than hardcoding it throughout the codebase.

## 6. Verification Status

- Contract compilation: successful.
- Unit tests: 5 passed.
- Sepolia deployment: recorded as successful by Hardhat Ignition.
- Sepolia integration test: completed successfully, including registration and read-back.
- ABI exported to `blockchain/abi/GarmentPassport.json`.

## 7. Important Limitations

The contract stores the metadata hash, timestamp, and registrant address—not the complete garment metadata. Metadata storage and retrieval must be handled by the backend or another agreed storage layer.

This contract does not implement garment updates or deletion.

The deployment uses Sepolia test ETH and is for development/testing, not production use.