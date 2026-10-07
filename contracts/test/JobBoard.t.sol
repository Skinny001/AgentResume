// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/JobBoard.sol";
import "../src/MockUSDT.sol";

contract JobBoardTest is Test {
    JobBoard public board;
    MockUSDT public usdt;
    address public owner = address(1);
    address public employer = address(2);
    address public user = address(3);
    address public agent = address(4);

    function setUp() public {
        usdt = new MockUSDT();
        vm.prank(owner);
        board = new JobBoard(address(usdt), owner);
        
        usdt.mint(user, 1000e6);
        vm.prank(user);
        usdt.approve(address(board), 1000e6);
    }

    function testPostJob() public {
        vm.prank(employer);
        board.postJob("Engineer", "Corp", "Qm...", bytes32(0), uint64(block.timestamp + 1 days));
        
        JobBoard.Job[] memory jobs = board.listJobs(0, 10);
        assertEq(jobs.length, 1);
        assertEq(jobs[0].title, "Engineer");
    }

    function testDepositAndApplyFor() public {
        vm.startPrank(user);
        board.deposit(100e6);
        board.authorizeAgent(agent, 5, uint64(block.timestamp + 1 days), 5e6);
        vm.stopPrank();
        
        vm.prank(employer);
        board.postJob("Dev", "Startup", "Qm...", bytes32(0), uint64(block.timestamp + 1 days));
        
        vm.prank(agent);
        board.applyFor(user, 0, "QmCover", bytes32(0));
        
        assertEq(board.balances(user), 95e6);
        assertEq(board.agentEarnings(agent), 5e6);
        
        JobBoard.Application[] memory apps = board.applicationsForJob(0, 0, 10);
        assertEq(apps.length, 1);
        assertEq(apps[0].applicant, user);
    }
}
