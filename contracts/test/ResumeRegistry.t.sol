// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ResumeRegistry.sol";

contract ResumeRegistryTest is Test {
    ResumeRegistry public registry;
    address public owner = address(1);
    address public user1 = address(2);
    address public issuer = address(3);

    function setUp() public {
        vm.prank(owner);
        registry = new ResumeRegistry(owner);
    }

    function testSetProfile() public {
        vm.startPrank(user1);
        string[] memory skills = new string[](2);
        skills[0] = "Solidity";
        skills[1] = "Foundry";
        registry.setProfile("Qm123", bytes32(uint256(1)), "Blockchain Dev", skills);
        
        ResumeRegistry.Profile memory profile = registry.getProfile(user1);
        assertEq(profile.resumeCid, "Qm123");
        assertEq(profile.headline, "Blockchain Dev");
        assertTrue(profile.exists);
        vm.stopPrank();
    }
    
    function testAddIssuerAndAttest() public {
        vm.prank(owner);
        registry.addIssuer(issuer);
        assertTrue(registry.issuers(issuer));
        
        vm.prank(issuer);
        registry.attestCredential(user1, "BSc CS", bytes32(uint256(2)));
        
        ResumeRegistry.Credential[] memory creds = registry.getCredentials(user1);
        assertEq(creds.length, 1);
        assertEq(creds[0].title, "BSc CS");
        assertEq(creds[0].issuer, issuer);
    }
}
