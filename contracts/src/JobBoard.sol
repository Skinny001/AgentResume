// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20 { 
    function transfer(address,uint256) external returns(bool); 
    function transferFrom(address,address,uint256) external returns(bool); 
}

contract JobBoard is Ownable {
    enum AppStatus { Submitted, Viewed, Shortlisted, Rejected, Hired }
    struct Job { uint256 id; address employer; string title; string company; string descriptionCid; bytes32 descriptionHash; uint64 closesAt; bool open; }
    struct Application { uint256 id; uint256 jobId; address applicant; address submittedBy; string coverLetterCid; bytes32 coverLetterHash; uint64 submittedAt; AppStatus status; }
    struct Delegation { address agent; uint32 maxApplications; uint32 used; uint64 expiresAt; uint256 feePerApplication; bool active; }
    
    IERC20 public immutable usdt; 
    uint256 public nextJobId; 
    uint256 public nextApplicationId; 
    mapping(uint256=>Job) public jobs; 
    mapping(uint256=>Application) public applications; 
    mapping(address=>uint256) public balances; 
    mapping(address=>Delegation) public delegations; 
    mapping(address=>uint256) public agentEarnings; 
    mapping(uint256=>uint256[]) private jobApps; 
    mapping(address=>uint256[]) private userApps; 
    mapping(uint256=>mapping(address=>bool)) public hasApplied;
    
    event JobPosted(uint256 indexed id,address indexed employer); 
    event Deposited(address indexed user,uint256 amount); 
    event Withdrawn(address indexed user,uint256 amount); 
    event AgentAuthorized(address indexed user,address indexed agent); 
    event AgentRevoked(address indexed user); 
    event Applied(uint256 indexed applicationId,uint256 indexed jobId,address indexed applicant,address submittedBy); 
    event StatusChanged(uint256 indexed applicationId,AppStatus status);
    
    error Invalid(); error Unauthorized(); error Closed(); error Duplicate();
    
    constructor(address token,address initialOwner) Ownable(initialOwner){usdt=IERC20(token);}
    
    function postJob(string calldata title,string calldata company,string calldata cid,bytes32 hash,uint64 closesAt) external { 
        if(closesAt<=block.timestamp) revert Invalid(); 
        uint256 id=nextJobId++; 
        jobs[id]=Job(id,msg.sender,title,company,cid,hash,closesAt,true); 
        emit JobPosted(id,msg.sender); 
    }
    
    function closeJob(uint256 id) external { 
        if(jobs[id].employer!=msg.sender) revert Unauthorized(); 
        jobs[id].open=false; 
    }
    
    function deposit(uint256 amount) external { 
        if(amount==0||!usdt.transferFrom(msg.sender,address(this),amount)) revert Invalid(); 
        balances[msg.sender]+=amount; 
        emit Deposited(msg.sender,amount); 
    }
    
    function withdraw(uint256 amount) external { 
        if(amount>balances[msg.sender]||!usdt.transfer(msg.sender,amount)) revert Invalid(); 
        balances[msg.sender]-=amount; 
        emit Withdrawn(msg.sender,amount); 
    }
    
    function authorizeAgent(address agent,uint32 max,uint64 expiry,uint256 fee) external { 
        if(agent==address(0)||max==0||expiry<=block.timestamp) revert Invalid(); 
        delegations[msg.sender]=Delegation(agent,max,0,expiry,fee,true); 
        emit AgentAuthorized(msg.sender,agent); 
    }
    
    function revokeAgent() external { 
        delegations[msg.sender].active=false; 
        emit AgentRevoked(msg.sender); 
    }
    
    function applyFor(address user,uint256 jobId,string calldata cid,bytes32 hash) external { 
        Delegation storage d=delegations[user]; 
        if(!d.active||d.agent!=msg.sender||d.used>=d.maxApplications||d.expiresAt<block.timestamp||balances[user]<d.feePerApplication) revert Unauthorized(); 
        balances[user]-=d.feePerApplication; 
        agentEarnings[msg.sender]+=d.feePerApplication; 
        d.used++; 
        _apply(user,msg.sender,jobId,cid,hash,true); 
    }
    
    // Kept for direct application by user (overloaded in original as `apply`, renaming to `applyDirect` here as apply is a keyword in older solidity, but let's stick to PRD/original 'apply')
    // Wait, apply is a valid function name in 0.8
    function applyDirect(uint256 jobId,string calldata cid,bytes32 hash) external { 
        _apply(msg.sender,msg.sender,jobId,cid,hash,false); 
    }
    
    function _apply(address user,address sender,uint256 jobId,string calldata cid,bytes32 hash,bool) internal { 
        Job storage j=jobs[jobId]; 
        if(!j.open||j.closesAt<block.timestamp) revert Closed(); 
        if(hasApplied[jobId][user]) revert Duplicate(); 
        hasApplied[jobId][user]=true; 
        uint256 id=nextApplicationId++; 
        applications[id]=Application(id,jobId,user,sender,cid,hash,uint64(block.timestamp),AppStatus.Submitted); 
        jobApps[jobId].push(id); 
        userApps[user].push(id); 
        emit Applied(id,jobId,user,sender); 
    }
    
    function setStatus(uint256 id,AppStatus status) external { 
        Application storage a=applications[id]; 
        if(jobs[a.jobId].employer!=msg.sender) revert Unauthorized(); 
        a.status=status; 
        emit StatusChanged(id,status); 
    }
    
    function claimEarnings() external { 
        uint256 amount=agentEarnings[msg.sender]; 
        agentEarnings[msg.sender]=0; 
        if(!usdt.transfer(msg.sender,amount)) revert Invalid(); 
    }
    
    function listJobs(uint256 offset,uint256 limit) external view returns(Job[] memory out){
        uint256 n=nextJobId; 
        if(offset>=n)return new Job[](0); 
        uint256 end=offset+limit>n?n:offset+limit; 
        out=new Job[](end-offset); 
        for(uint256 i=offset;i<end;i++)out[i-offset]=jobs[i];
    }
    
    function applicationsOf(address user,uint256 offset,uint256 limit) external view returns(Application[] memory out){
        return _slice(userApps[user],offset,limit);
    }
    
    function applicationsForJob(uint256 id,uint256 offset,uint256 limit) external view returns(Application[] memory out){
        return _slice(jobApps[id],offset,limit);
    }
    
    function _slice(uint256[] storage ids,uint256 offset,uint256 limit) internal view returns(Application[] memory out){
        if(offset>=ids.length)return new Application[](0);
        uint256 end=offset+limit>ids.length?ids.length:offset+limit;
        out=new Application[](end-offset);
        for(uint256 i=offset;i<end;i++)out[i-offset]=applications[ids[i]];
    }
}

interface IERC20Approve { function approve(address,uint256) external returns(bool); }

// Deploy JobBoard with the real token or MockUSDT address.
contract DeployableJobBoard {}
