pragma solidity ^0.8.0;

import "./ERC20.sol";
import "./ERC20Burnable.sol";
import "./Ownable.sol";

contract TokenERC20 is ERC20, ERC20Burnable, Ownable {
    constructor() payable ERC20("TokenERC20 ", "TKE")  {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}