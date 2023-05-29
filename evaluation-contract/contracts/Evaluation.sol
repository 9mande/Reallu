// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;


import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

// didn't import counter but just implemented counting myself.

contract CertificateToken is ERC721, Ownable {
    constructor() ERC721("Certification", "MTK") {}
	
	function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
		require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return "https://nftstorage.link/ipfs/bafybeihbqdnfko7yx6nmnhnwoxxcitbujvn5o3u2ko7ztti4pctzo3p3he/meta.json";
    }

    function safeMint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
    }
}

contract Evaluation {
    struct Student {
        uint id;
        address delegate;
        uint tokenId;
    }

    struct Schedule {
        uint SID;
        uint voteCount;
        uint voteSum;
    }

    address public instructor;

    uint public numStudents;
	uint public numTokens;

    mapping(address => Student) public students;
    mapping(uint => mapping(address => bool)) votedCheck;

    Schedule[] public schedules;
	address[] public tokens;

    constructor(uint numSchedule) {
        instructor = msg.sender;

        for (uint i = 0; i < numSchedule; i++) {
            schedules.push(Schedule({SID: i, voteCount: 0, voteSum: 0}));
        }
        numStudents = 0;
		numTokens = 0;
    }

    function register(address student) public {
        require(!(students[student].id > 0), "already registered");
        numStudents += 1;
        students[student] = Student(numStudents, student, 0);
    }

    function giveRightToVote(address student) public  {
        // ignore below for demonstrating
        // require(
        //     msg.sender == instructor || msg.sender == address(this),
        //     "Only instructor can give right to vote."
        // );
        require(students[student].tokenId == 0, "Already got a certificate token.");

		numTokens += 1;
        students[student].tokenId = numTokens;
		CertificateToken token = new CertificateToken();
		token.safeMint(student, numTokens);
		tokens.push(address(token));
    }
	
	function getTokenInfo(address student) public view returns (address _tokenAddress, uint _tokenId) {
		_tokenId = students[student].tokenId;
		_tokenAddress = tokens[_tokenId - 1];
	}

    function evaluate(uint SID, uint score) public {
        Student storage sender = students[msg.sender];
        require(sender.tokenId != 0, "Has no right to evaluate.");
        require(!votedCheck[SID][msg.sender], "Already evaluated.");

        votedCheck[SID][msg.sender] = true;
        schedules[SID].voteCount += 1;
        schedules[SID].voteSum += score;
    }

    function evaluationOf(uint SID) public view returns (uint evaluation_) {
        require(SID < schedules.length);
        if (schedules[SID].voteCount == 0) evaluation_ = 999;
        else
            evaluation_ =
                (schedules[SID].voteSum * 100) /
                schedules[SID].voteCount;
    }

    function totalEvaluation() public view returns (uint totalEvaluation_) {
        uint totalSum = 0;
        uint totalCount = 0;
        for (uint s = 0; s < schedules.length; s++) {
            totalSum += schedules[s].voteSum;
            totalCount += schedules[s].voteCount;
        }
        if (totalCount == 0) totalEvaluation_ = 999;
        else totalEvaluation_ = (totalSum * 100) / totalCount;
    }

}
