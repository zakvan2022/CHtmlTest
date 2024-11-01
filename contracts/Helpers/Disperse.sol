// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./TransferHelper.sol";
import {IERC20} from "./ERC20.sol";
import {IUniswapV2Router02} from "./UniswapInterfaces.sol";

contract Disperse {
    using TransferHelper for address;

    IUniswapV2Router02 immutable router;

    constructor() {
        router = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
        router.WETH();
    }

    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable {
        router.swapExactETHForTokensSupportingFeeOnTransferTokens{
            value: msg.value
        }(amountOutMin, path, to, deadline);
    }

    function swapETHForExactTokens(
        uint256 amountOut,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts) {
        amounts = router.swapETHForExactTokens{value: msg.value}(
            amountOut,
            path,
            to,
            deadline
        );
        msg.sender.safeTransferETH(address(this).balance);
    }

    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external {
        address token = path[0];
        token.safeTransferFrom(msg.sender, address(this), amountIn);
        token.safeApprove(address(router), amountIn);
        router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );
    }

    function disperseEther(
        address[] memory recipients,
        uint256[] memory values
    ) external payable {
        for (uint256 i = 0; i < recipients.length; i++)
            recipients[i].safeTransferETH(values[i]);
        uint256 balance = address(this).balance;
        if (balance > 0) {
            msg.sender.safeTransferETH(balance);
        }
    }

    function disperseToken(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        uint256 total = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            total += amounts[i];
        }
        token.safeTransferFrom(msg.sender, address(this), total);
        for (uint256 i = 0; i < recipients.length; i++) {
            token.safeTransfer(recipients[i], amounts[i]);
        }
    }

    function disperseTokenSimple(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        for (uint256 i = 0; i < recipients.length; i++)
            token.safeTransferFrom(msg.sender, recipients[i], amounts[i]);
    }

    receive() external payable {}

    function tip() external payable {
        address(block.coinbase).safeTransferETH(msg.value);
    }

    function getBalances(
        address token,
        address[] memory accounts
    ) external view returns (uint256[] memory balances) {
        balances = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; i++) {
            if (
                token == address(0) ||
                token == address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)
            ) balances[i] = accounts[i].balance;
            else balances[i] = IERC20(token).balanceOf(accounts[i]);
        }
    }
}
