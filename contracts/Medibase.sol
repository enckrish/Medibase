//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Medibase_Interactor {
    address public admin;
    uint public adminFee; // To facilitate smart contract state updates
    
    struct Validators {
        string nodeID;
        address payAddr;
    }
    Validators[] vdrList;
    
    uint public fee;
    mapping(address => uint) addrToNumTransactions; // For generating IDs
    mapping(address => uint) public addrToLatestID; // For getting IDs in frontend
    mapping(uint => address) public payIDtoAddr;   // For invalidating ID
    mapping(uint => bool) idTaken; // For identifying ID reuse
    
    constructor(address _admin, uint _fee, uint _adminFee) {
        require(_adminFee <= 1000, "The condition adminFee >= 0 && adminFee <= 1000 is not met.");
        admin = _admin;
        fee = _fee;
        adminFee = _adminFee;
    }
    
    function addValidator(string memory nodeID, address payAddr) public onlyAdmin {
        vdrList.push(Validators(nodeID, payAddr));
    }

    function payValidators() public {
        // Check balance of contract beforehand to avoid gas costs
        require(address(this).balance > 0, "All funds already distributed!");
        require(vdrList.length > 0, "No validators registered yet!");
        
        payable(admin).transfer((address(this).balance * adminFee) / 1000);
        uint amountToPay = address(this).balance / vdrList.length;
        
        for (uint i = 0; i < vdrList.length; i++)
            payable(vdrList[i].payAddr).transfer(amountToPay);
    }
    
    function removeValidator(string memory nodeID) public onlyAdmin {
        for (uint i = 0; i < vdrList.length; i++) {
            string memory _nodeID = vdrList[i].nodeID;
            if (keccak256(abi.encodePacked(_nodeID)) == keccak256(abi.encodePacked(nodeID))) {
                delete vdrList[i];
                break;
            }
        }
    }
    
    function isValidatorAdded(string memory nodeID) public view returns(bool) {
        for (uint i = 0; i < vdrList.length; i++) {
            string memory _nodeID = vdrList[i].nodeID;
            if (keccak256(abi.encodePacked(_nodeID)) == keccak256(abi.encodePacked(nodeID)))
                return true;
        }
        return false;
    }

    function deposit() public payable returns(uint ID) {
        require(msg.value == fee);
        address payee = msg.sender;
        while(true) {
            ID = uint(keccak256(abi.encodePacked(payee, addrToNumTransactions[payee])));
            addrToNumTransactions[payee]++;
            if (idTaken[ID] != true) {
                idTaken[ID] = true;
                break;
            }
        }
        addrToLatestID[payee] = ID;
        payIDtoAddr[ID] = payee;
        return ID;
    }
    
    function invalidateID(uint payID) public onlyAdmin {
        address payee = payIDtoAddr[payID];
        payIDtoAddr[payID] = address(0);
        addrToLatestID[payee] = 0;
    }
    
    modifier onlyAdmin {
        require(msg.sender == admin, "This operation requires admin privileges");
        _;
    }
}