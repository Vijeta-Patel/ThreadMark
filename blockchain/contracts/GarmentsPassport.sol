// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract GarmentPassport {
    struct Garment {
        string productId;
        string brand;
    }
    mapping (string => Garment) public garments;
    function registerGarment(string memory productId, string memory brand) public {
        if(bytes(productId).length == 0) {
            // reject
            revert("enter product id!");
        }

        else if(bytes(garments[productId].productId).length != 0) {
            // as some length of the produntId already exists
            revert("garment already exists!");
        }

        else {
            garments[productId] = Garment({
                productId: productId,
                brand: brand
            });
        }      
    }
    function getGarment(string memory productId) public view returns(string memory){
        Garment memory g;
        g = garments[productId];
        return g.brand;
    }
}