App = {
  web3Provider: null,
  contracts: {},
	
  // 프론트 로딩시 json파일을 불러와서 로딩시키기위해 init 함수안에 json파일을 불러와서 이미지,아이디,타입,면적,가격 을 저장한다
  init: function() {
    $.getJSON('../real-estate.json', function(data) {
      var list = $('#list');
      var template = $('#template');

      //for문을 사용해 json을 data에 저장한곳을 하나하나 돌면서 템플릿에 부여 htmlappend list에 저장한다
      for (i = 0; i < data.length; i++) {
        template.find('img').attr('src', data[i].picture);
        template.find('.id').text(data[i].id);
        template.find('.type').text(data[i].type);
        template.find('.area').text(data[i].area);
        template.find('.price').text(data[i].price);

        list.append(template.html());
      }
    })

    return App.initWeb3();//위에 템플릿저장까지끝나면 initWeb3 함수를 불러온다
  },

  //컨트랙 인스턴스화
  initWeb3: function() {
    if (typeof  web3 !== 'undefined') { //주입된 인스턴스가 존재하게되면
      App.web3Provider = web3.currentProvider; //web3provider 전역변수에 공급자를 불러오고
      web3 = new Web3(web3.currentProvider); //공급자의 정보를 바탕으로 Dapp에서 사용할수있는 오브젝트를 생성
    } else {
      App.web3Provider = new web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(App.web3Provider);
    }

    return App.initContract(); //위작업이 끝나면 initcontract함수를 불러온다
  },

  //컨트랙 인스턴스화
  initContract: function() {
		$.getJSON('RealEstate.json', function(data) {
      App.contracts.RealEstate = TruffleContract(data);
      App.contracts.RealEstate.setProvider(App.web3Provider);
      App.listenToEvents();//리스트 불러오기 or 매물구매했다는 이벤트 불러오기
    });
  },

  //매입했을때 구매함수
  buyRealEstate: function() {	
    var id = $('#id').val();
    var name = $('#name').val();
    var price = $('#price').val();
    var age = $('#age').val();

    web3.eth.getAccounts(function(error, accounts) {  
      if (error) {  //콜백 에러 콘솔에 에러창
        console.log(error);
      }

      var account = accounts[0]; //0번째 계정 account 저장

      App.contracts.RealEstate.deployed().then(function(instance) {
        var nameUtf8Encoded = utf8.encode(name); //utf8 인코딩
        return instance.buyRealEstate(id, web3.toHex(nameUtf8Encoded), age, { from: account, value: price}); //bytes32 타입을 hex타입으로변환 
      }).then(function() {
        $('#name').val(''); //모달창 인풋필드 초기화
        $('#age').val('');
        $('#buyModal').modal('hide');
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  //매물판매가되면 판매완료처리
  loadRealEstates: function() {
    App.contracts.RealEstate.deployed().then(function(instance) {
      return instance.getAllBuyers.call();
    }).then(function(buyers) {
      for (i = 0; i < buyers.length; i++) {
        if (buyers[i] !== '0x0000000000000000000000000000000000000000') { //해당 buyers 배열에 주소가 존재한다면 (0x00이부분은 빈주소를 의미한다)
          var imgType = $('.panel-realEstate').eq(i).find('img').attr('src').substr(7);

          switch(imgType) { //팔린이미지로 교체
            case 'apartment.jpg':
            $('.panel-realEstate').eq(i).find('img').attr('src', 'images/apartment_sold.jpg')
            break;
            case 'townhouse.jpg':
            $('.panel-realEstate').eq(i).find('img').attr('src', 'images/townhouse_sold.jpg')
            break;
            case 'house.jpg':
            $('.panel-realEstate').eq(i).find('img').attr('src', 'images/house_sold.jpg')
            break;
          }

          $('.panel-realEstate').eq(i).find('.btn-buy').text('매각').attr('disabled', true); //텍스트를 매각으로바꾸고 버튼 비활성화
          $('.panel-realEstate').eq(i).find('.btn-buyerInfo').removeAttr('style');//매입자정보버튼 활성화
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    })
  },
	
  //매물이 판매되면 이벤트로 모든사용자에게 명시된다
  listenToEvents: function() {
    App.contracts.RealEstate.deployed().then(function(instance) {
      instance.LogBuyRealEstate({}, { fromBlock: 0, toBlock: 'latest'}).watch(function(error, event) {
        if (!error) {
          $('#events').append('<p>' + event.args._buyer + ' 계정에서 ' + event.args._id + ' 번 매물을 매입했습니다 !!' + '</p>');
        } else {
          console.error(error);
        }
        App.loadRealEstates();
      })
    })
  }
};

//
$(function() {
  //프론트 로딩시 불러오는부분 window 함수사용.
  $(window).load(function() {
    App.init(); //init 함수를 불러온다 (json파일)
  });

  $('#buyModal').on('show.bs.modal', function(e) { //매입버튼을 클릭했을때 모달창이 켜있을경우
    var id = $(e.relatedTarget).parent().find('.id').text();
    var price = web3.toWei(parseFloat($(e.relatedTarget).parent().find('.price').text() || 0), "ether"); //템플릿에있는 가격타입을 text(string) 타입인데 float타입으로바꾸고  towei를 ether타입으로 바꾼다

    $(e.currentTarget).find('#id').val(id); //id값을 찾아서 전달!!
    $(e.currentTarget).find('#price').val(price); //가격값을 찾아서 전달
  });

  $('#buyerInfoModal').on('show.bs.modal', function(e) { //매입자정보버튼 모달창 활성화
    var id = $(e.relatedTarget).parent().find('.id').text();
    
    App.contracts.RealEstate.deployed().then(function(instance) {
      return instance.getBuyerInfo.call(id);
    }).then(function(buyerInfo){
      $(e.currentTarget).find('#buyerAddress').text(buyerInfo[0]);
      $(e.currentTarget).find('#buyerName').text(web3.toUtf8(buyerInfo[1]));
      $(e.currentTarget).find('#buyerAge').text(buyerInfo[2]);
    }).catch(function(err) {
      console.log(err.message);
    })
  });
});
