// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ResumeRegistry is Ownable {
    struct Profile { string resumeCid; bytes32 resumeHash; string headline; string[] skills; uint64 updatedAt; bool exists; }
    struct Credential { address issuer; string title; bytes32 docHash; uint64 issuedAt; bool revoked; }
    mapping(address => Profile) private profiles;
    mapping(address => Credential[]) private credentials;
    mapping(address => bool) public issuers;
    uint256 public constant MAX_SKILLS = 15;
    event ProfileSet(address indexed user, bytes32 resumeHash, string resumeCid);
    event CredentialAttested(address indexed user, address indexed issuer, uint256 index, bytes32 docHash);
    event IssuerUpdated(address indexed issuer, bool allowed);
    error InvalidInput(); error NotIssuer(); error NotCredentialIssuer();
    constructor(address initialOwner) Ownable(initialOwner) {}
    function setProfile(string calldata cid, bytes32 hash, string calldata headline, string[] calldata skills) external {
        if (bytes(headline).length > 80 || skills.length > MAX_SKILLS) revert InvalidInput();
        for (uint256 i; i < skills.length; i++) if (bytes(skills[i]).length > 32) revert InvalidInput();
        profiles[msg.sender] = Profile(cid, hash, headline, skills, uint64(block.timestamp), true);
        emit ProfileSet(msg.sender, hash, cid);
    }
    function addIssuer(address issuer) external onlyOwner { issuers[issuer] = true; emit IssuerUpdated(issuer, true); }
    function removeIssuer(address issuer) external onlyOwner { issuers[issuer] = false; emit IssuerUpdated(issuer, false); }
    function attestCredential(address user, string calldata title, bytes32 docHash) external { if (!issuers[msg.sender]) revert NotIssuer(); credentials[user].push(Credential(msg.sender,title,docHash,uint64(block.timestamp),false)); emit CredentialAttested(user,msg.sender,credentials[user].length-1,docHash); }
    function revokeCredential(address user, uint256 index) external { Credential storage c = credentials[user][index]; if (c.issuer != msg.sender) revert NotCredentialIssuer(); c.revoked = true; }
    function getProfile(address user) external view returns (Profile memory) { return profiles[user]; }
    function getCredentials(address user) external view returns (Credential[] memory) { return credentials[user]; }
}

