// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./USDC.sol";

interface IINRC is IERC20 {

    function mint(address recipient, uint inrcAmount) external;

    function getExchangeRate() external view returns(uint);

    function burn(uint _amount) external;

}

contract Exchange {

    IINRC inr;
    USDC usdc;
    uint exchangeRate;

    mapping (address => uint) public USDCRegistry;

    constructor(address _usdc) {
        inr = IINRC(msg.sender);
        usdc = USDC(_usdc);
    }

    function mint(uint usdcAmount) external {
        
        exchangeRate = inr.getExchangeRate();
        uint inrcAmount = usdcAmount * exchangeRate;

        USDCRegistry[msg.sender] += usdcAmount;
        
        bool success = usdc.transferFrom(msg.sender, address(this), usdcAmount);
        require(success, "Could not transfer token. Missing approval?");
        inr.mint(msg.sender, inrcAmount);
    }

    function redeem(uint inrcAmount) external {
        uint usdcAmount = inrcAmount / inr.getExchangeRate();

        USDCRegistry[msg.sender] -= usdcAmount;

        uint fees = (usdcAmount * 5)/1000;  //0.5% fees in USDC
        uint restAmount = usdcAmount - fees; //99.5% rest USDC amount
        
        bool success = usdc.transferFrom(msg.sender, address(this), fees);
        require(success, "Could not transfer token. Missing approval?");

        bool success2 = usdc.transferFrom(address(this), msg.sender, restAmount);
        require(success2, "Could not transfer token. Missing approval?");

        inr.burn(inrcAmount);
    }

    // function getINRTokenBalance() external view returns

    function INR_BalanceOf(address account) public view returns (uint256) {
        return inr.balanceOf(account);
    }


    function USDC_BalanceOf(address account) public view returns (uint256) {
        return USDCRegistry[account];
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

    constructor(string memory tokenName, string memory tokenSymbol, address _usdc) ERC20(tokenName, tokenSymbol) {
        exe = new Exchange(_usdc);
        usdc = USDC(_usdc);
    }

    function mint(address recipient, uint inrcAmount) public {
        require(msg.sender == address(exe), "Only exchange contract");
        require(inrcAmount > 0, "usdcAmount=0");
        _mint(recipient, inrcAmount);
    }

    function burn(uint _amount) external {
        _burn(msg.sender, _amount);
    }

    function getExchangeRate() external pure returns(uint) {
        return usdcInrExchangeRate;
    }


}