// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockUSDT { 
    string public name = "Mock USDT"; 
    string public symbol = "USDT"; 
    uint8 public decimals = 6; 
    mapping(address=>uint256) public balanceOf; 
    mapping(address=>mapping(address=>uint256)) public allowance; 
    
    function mint(address to,uint256 amount) external { 
        balanceOf[to]+=amount; 
    } 
    
    function approve(address s,uint256 a) external returns(bool){
        allowance[msg.sender][s]=a;
        return true;
    } 
    
    function transfer(address to,uint256 a) external returns(bool){
        require(balanceOf[msg.sender]>=a);
        balanceOf[msg.sender]-=a;
        balanceOf[to]+=a;
        return true;
    } 
    
    function transferFrom(address f,address t,uint256 a) external returns(bool){
        require(balanceOf[f]>=a&&allowance[f][msg.sender]>=a);
        allowance[f][msg.sender]-=a;
        balanceOf[f]-=a;
        balanceOf[t]+=a;
        return true;
    } 
}
