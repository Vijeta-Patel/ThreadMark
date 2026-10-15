// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract GarmentPassport {
    struct Garment {
        bytes32 dataHash;
        uint256 timestamp;
        address registrant;
    }

    mapping(string => Garment) private garments;

    event GarmentRegistered(string pid, bytes32 dataHash, address registrant, uint256 timestamp);

    function registerGarment(string calldata pid, bytes32 dataHash) external {
        if (bytes(pid).length == 0) {
            revert("pid required");
        }

        if (garments[pid].timestamp != 0) {
            revert("garment already exists");
        }

        garments[pid] = Garment({
            dataHash: dataHash,
            timestamp: block.timestamp,
            registrant: msg.sender
        });

        emit GarmentRegistered(pid, dataHash, msg.sender, block.timestamp);
    }

    function getGarment(string calldata pid)
        external
        view
        returns (bytes32 dataHash, uint256 timestamp, address registrant)
    {
        Garment memory g = garments[pid];
        return (g.dataHash, g.timestamp, g.registrant);
    }
}
