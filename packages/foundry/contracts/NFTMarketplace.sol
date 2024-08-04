// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTMarketplace is ERC721URIStorage {
  address payable owner;

  uint256 private _tokenIds;
  uint256 private _itemsSold;

  uint256 listPrice = 0.01 ether;

  constructor() ERC721("NFTMarketplace", "NFTM") {
    owner = payable(msg.sender);
  }

  struct ListedToken {
    uint256 tokenId;
    address payable owner;
    address payable seller;
    uint256 price;
    bool currentlyListed;
  }

  //Success listed event
  event TokenListedSuccess(
    uint256 indexed tokenId,
    address owner,
    address seller,
    uint256 price,
    bool currentlyListed
  );

  //Maps the token _tokenIds
  mapping(uint256 => ListedToken) private idToListedToken;

  function updateListPrice(uint256 _listPrice) public payable {
    require(owner == msg.sender, "Only Owner can update the listing price");

    listPrice = _listPrice;
  }

  function getListPrice() public view returns (uint256) {
    return listPrice;
  }

  function getLatestIdToListedToken() public view returns (ListedToken memory) {
    uint256 currentTokenId = _tokenIds; //current tokenId count
    return idToListedToken[currentTokenId];
  }

  function getListedForTokenId(uint256 _tokenId)
    public
    view
    returns (ListedToken memory)
  {
    return idToListedToken[_tokenId];
  }

  function getCurrentToken() public view returns (uint256) {
    return _tokenIds; //current tokenIds
  }

  function createToken(
    string memory tokenURI,
    uint256 price
  ) public payable returns (uint256) {
    require(msg.value == listPrice, "Send enough ether to list");
    require(price > 0, "Make sure the price is not negative");

    _tokenIds++; //increment tokenId
    uint256 currentTokenId = _tokenIds;

    _safeMint(msg.sender, currentTokenId);

    _setTokenURI(currentTokenId, tokenURI);

    createListedToken(currentTokenId, price);

    return currentTokenId;
  }

  function createListedToken(uint256 tokenId, uint256 price) private {
    idToListedToken[tokenId] = ListedToken(
      tokenId, payable(address(this)), payable(msg.sender), price, true
    );

    _transfer(msg.sender, address(this), tokenId);

    //Emit the event for successful transfer. The frontend parses this message and updates the frontend ui
    emit TokenListedSuccess(tokenId, address(this), msg.sender, price, true);
  }

  //Returns the currently listed NFTs on the marketplace
  function getAllNFTs() public view returns (ListedToken[] memory) {
    uint256 nftCount = _tokenIds;
    ListedToken[] memory tokens = new ListedToken[](nftCount);
    uint256 currentIndex = 0;
    uint256 currentId;
    //at the moment currentlyListed is true for all, if it becomes false in the future we will
    //filter out currentlyListed == false over here
    for (uint256 i = 0; i < nftCount; i++) {
      currentId = i + 1;
      ListedToken storage currentItem = idToListedToken[currentId];
      tokens[currentIndex] = currentItem;
      currentIndex += 1;
    }
    //the array 'tokens' has the list of all NFTs in the marketplace
    return tokens;
  }

  //Returns all the NFTs where the current user is the owner or seller
  function getMyNFTs() public view returns (ListedToken[] memory) {
    uint256 totalItemCount = _tokenIds;
    uint256 itemCount = 0;
    uint256 currentIndex = 0;
    uint256 currentId;
    //Important to get a count of all the NFTs that belong to the user before we can make an array for them
    for (uint256 i = 0; i < totalItemCount; i++) {
      if (
        idToListedToken[i + 1].owner == msg.sender
          || idToListedToken[i + 1].seller == msg.sender
      ) {
        itemCount += 1;
      }
    }

    //Once you have the count of relevant NFTs, create an array then store all the NFTs in it
    ListedToken[] memory items = new ListedToken[](itemCount);
    for (uint256 i = 0; i < totalItemCount; i++) {
      if (
        idToListedToken[i + 1].owner == msg.sender
          || idToListedToken[i + 1].seller == msg.sender
      ) {
        currentId = i + 1;
        ListedToken storage currentItem = idToListedToken[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }
    return items;
  }

  function executeSale(uint256 tokenId) public payable {
    uint256 price = idToListedToken[tokenId].price;
    address seller = idToListedToken[tokenId].seller;
    require(
      msg.value == price,
      "Please submit the asking price in order to complete the purchase"
    );

    //update the details of the token
    idToListedToken[tokenId].currentlyListed = true;
    idToListedToken[tokenId].seller = payable(msg.sender);
    _itemsSold++;

    //Actually transfer the token to the new owner
    _transfer(address(this), msg.sender, tokenId);
    //approve the marketplace to sell NFTs on your behalf
    approve(address(this), tokenId);

    //Transfer the listing fee to the marketplace creator
    payable(owner).transfer(listPrice);
    //Transfer the proceeds from the sale to the seller of the NFT
    payable(seller).transfer(msg.value);
  }
}
