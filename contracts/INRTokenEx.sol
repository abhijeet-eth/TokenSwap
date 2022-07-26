// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./USDC.sol";

interface IINRC is IERC20 {

    function mint(address recipient, uint inrcAmount) external;

    function getExchangeRate() external view returns(uint);

    function burn(address from, uint _amount) external;

}

contract Exchange {

    IINRC inr;
    USDC usdc;
    uint exchangeRate;
    address immutable owner;
    uint public fees;

    mapping (address => uint) public contractUSDCRegistry; //Contract USDC amount as fees stored in contract 
    mapping (address => uint) public userUSDCRegistry; //USDC amount of user stored in contract
    mapping (address => uint) public feesRegistry; //Total Fees accumulated

    event FeesUpdated(address, uint);
    constructor(address _usdc, address _owner) {
        inr = IINRC(msg.sender);
        usdc = USDC(_usdc);
        owner = _owner;
    }

    modifier onlyOwner(){
        require(msg.sender == owner, "Not owner");
        _;
    }

    function mint(uint usdcAmount) external {
        
        exchangeRate = inr.getExchangeRate();
        uint inrcAmount = usdcAmount * exchangeRate;

        userUSDCRegistry[msg.sender] += usdcAmount;
        
        bool success = usdc.transferFrom(msg.sender, address(this), usdcAmount);
        require(success, "Could not transfer token. Missing approval?");
        inr.mint(msg.sender, inrcAmount);
    }

    function redeem(uint inrcAmount) external {
        uint usdcAmount = inrcAmount / inr.getExchangeRate();

        userUSDCRegistry[msg.sender] -= usdcAmount;

        fees = (usdcAmount * 5)/1000;  //0.5% Redemption fees in USDC
        uint restAmount = usdcAmount - fees; //99.5% rest USDC amount

        emit FeesUpdated(msg.sender, fees);       

        feesRegistry[address(this)] += fees;
        
        // bool success = usdc.transferFrom(msg.sender, address(this), fees);
        // require(success, "Could not transfer token. Missing approval?");

        // contractUSDCRegistry[address(this)] += fees;

        usdc.approve(address(this), restAmount);

        bool success2 = usdc.transferFrom(address(this), msg.sender, restAmount);
        require(success2, "Could not transfer token. Missing approval?");

        inr.burn(msg.sender, inrcAmount); //redeemed INRC token burnt
    }

    // function getINRTokenBalance() external view returns

    function INR_BalanceOf(address account) public view returns (uint256) {
        return inr.balanceOf(account);
    }


    function USDC_BalanceOf(address account) public view returns (uint256) {
        return userUSDCRegistry[account];
    }

    function transferFeesToOwner() external{
        require(fees > 0, "No fees to claim");
        require(msg.sender == owner, "Not owner");
        feesRegistry[address(this)] = 0;
        usdc.transfer(msg.sender, fees);
    }

    function getFees() external view returns(uint){
        return feesRegistry[address(this)];
    } 

}

/**
 * @title INRC
 * @dev ERC20 INRC token
 */
contract INRC is ERC20 {

    Exchange public immutable exe;
    USDC usdc;
    uint constant usdcInrExchangeRate = 80;

    constructor(string memory tokenName, string memory tokenSymbol, address _usdc, address _owner) ERC20(tokenName, tokenSymbol) {
        exe = new Exchange(_usdc, _owner);

        usdc = USDC(_usdc);
    }

    function mint(address recipient, uint inrcAmount) public {
        require(msg.sender == address(exe), "Only exchange contract");
        require(inrcAmount > 0, "usdcAmount=0");
        _mint(recipient, inrcAmount);
    }

    function burn(address from, uint _amount) external {
        _burn(from, _amount);
    }

    function getExchangeRate() external pure returns(uint) {
        return usdcInrExchangeRate;
    }


}