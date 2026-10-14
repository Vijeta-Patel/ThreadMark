
 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract GarmentPassport {
    struct Garment {
        bytes32 dataHash;
        uint256 timestamp;
        address registrant;
    }

    mapping(string => Garment) private garments;

    event GarmentRegistered(
        string pid,
        bytes32 dataHash,
        address registrant,
        uint256 timestamp
    );

    function registerGarment(
        string memory pid,
        bytes32 dataHash
    ) public {
        require(bytes(pid).length > 0, "pid required");
        require(
            garments[pid].timestamp == 0,
            "garment already exists"
        );

        uint256 registeredAt = block.timestamp;

        garments[pid] = Garment({
            dataHash: dataHash,
            timestamp: registeredAt,
            registrant: msg.sender
        });

        emit GarmentRegistered(
            pid,
            dataHash,
            msg.sender,
            registeredAt
        );
    }

    function getGarment(
        string memory pid
    )
        public
        view
        returns (
            bytes32 dataHash,
            uint256 timestamp,
            address registrant
        )
    {
        Garment memory garment = garments[pid];

        return (
            garment.dataHash,
            garment.timestamp,
            garment.registrant
        );
    }
}
