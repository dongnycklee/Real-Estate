pragma solidity ^0.4.23;
//소유자 생성자 함수 배포할때 단한번만 호출되도록 컨트랙의 소유자를 정해준다
contract RealEstate {
  struct Buyer {
    address buyerAddress;
    bytes32 name;
    uint age;
  }

  mapping (uint => Buyer) public buyerInfo;
  address public owner;
  address[10] public buyers;

  event LogBuyRealEstate(
    address _buyer,
    uint _id
  );
  //msg.sender = 현재 사용하는 계정 을 owner상태변수에 대입해줘서 이컨트랙의 주인은 현재 배포하는컨트랙의 주인을 정해준다
  constructor() public {
    owner = msg.sender;
  }

  function buyRealEstate(uint _id, bytes32 _name, uint _age) public payable {
    require(_id >= 0 && _id <= 9);
    buyers[_id] = msg.sender;
    buyerInfo[_id] = Buyer(msg.sender, _name, _age);

    owner.transfer(msg.value);
    emit LogBuyRealEstate(msg.sender, _id);
  }

  function getBuyerInfo(uint _id) public view returns (address, bytes32, uint) {
    Buyer memory buyer = buyerInfo[_id];
    return (buyer.buyerAddress, buyer.name, buyer.age);
  }

  function getAllBuyers() public view returns (address[10]) {
    return buyers;
  }
}
