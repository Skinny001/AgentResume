// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ResumeRegistry.sol";
import "../src/JobBoard.sol";
import "../src/MockUSDT.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address owner = vm.addr(deployerPrivateKey);
        console.log("Deployer (Owner) Address:", owner);

        // 1. Deploy ResumeRegistry
        ResumeRegistry registry = new ResumeRegistry(owner);
        console.log("ResumeRegistry deployed at:", address(registry));

        // 2. Deploy MockUSDT (so you can easily mint for testing)
        MockUSDT usdt = new MockUSDT();
        console.log("MockUSDT deployed at:", address(usdt));

        // 3. Deploy JobBoard
        JobBoard board = new JobBoard(address(usdt), owner);
        console.log("JobBoard deployed at:", address(board));

        vm.stopBroadcast();
    }
}
