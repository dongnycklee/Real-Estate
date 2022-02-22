pragma solidity ^0.4.23;
//소유자 생성자 함수 배포할때 단한번만 호출되도록 컨트랙의 소유자를 정해준다
contract RealEstate {
  //매입자의 정보
  struct Buyer {
    address buyerAddress;
    bytes32 name;
    uint age;
  }
  //상태변수로 매입자의 맵핑함수를써서 매입자의 정보를 불러온다
  mapping (uint => Buyer) public buyerInfo;
  address public owner;
  address[10] public buyers; //매물을 10개로 배열에 저장한다

  //블록안에 저장할 이벤트함수
  event LogBuyRealEstate(
    address _buyer,
    uint _id
  );

  //msg.sender = 현재 사용하는 계정 을 owner상태변수에 대입해줘서 이컨트랙의 주인은 현재 배포하는컨트랙의 주인을 정해준다
  constructor() public {
    owner = msg.sender;
  }

  //매물구입 함수 
  function buyRealEstate(uint _id, bytes32 _name, uint _age) public payable {
    require(_id >= 0 && _id <= 9); //매물의 id가 0에서 9까지안에있는지 확인
    buyers[_id] = msg.sender; //매개변수로받은 매물의 아이디를 buyers 같은 위치의 인덱스에 저장시킨다
    buyerInfo[_id] = Buyer(msg.sender, _name, _age); //현재 매물을 매입한주소와,이름,나이를 대입한다

    owner.transfer(msg.value); //owner[컨트랙의주인계정] 으로 트랜스퍼 함수롤사용 이더를 송금한다
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
