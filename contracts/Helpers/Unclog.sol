// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./TransferHelper.sol";
import {IERC20} from "./ERC20.sol";
import {IUniswapV2Router02} from "./UniswapInterfaces.sol";

contract Unclog {
    using TransferHelper for address;

    IUniswapV2Router02 immutable router;
    IERC20 immutable weth;

    constructor() {
        router = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
        weth = IERC20(router.WETH());
    }

    function unclog(
        address tokenAddress,
        address pair,
        uint256 maxTxCount,
        uint256 maxWalletSize,
        uint256 taxSwapThreshold,
        uint256 gasReserve,
        uint256 ethReserve
    ) external payable {
        IERC20 token = IERC20(tokenAddress);
        tokenAddress.safeApprove(address(router), type(uint256).max);
        uint256 pairWethBefore = weth.balanceOf(pair);
        uint256 buyCount;
        address[] memory buyPath = new address[](2);
        buyPath[0] = address(weth);
        buyPath[1] = tokenAddress;

        address[] memory sellPath = new address[](2);
        sellPath[1] = address(weth);
        sellPath[0] = tokenAddress;

        while (gasleft() > gasReserve) {
            uint[] memory amounts = router.getAmountsIn(maxWalletSize, buyPath);
            uint256 maxBuyETH = amounts[0];
            uint256 buyETH = min(address(this).balance, maxBuyETH);

            if (address(this).balance - buyETH < ethReserve) {
                break;
            }

            router.swapExactETHForTokensSupportingFeeOnTransferTokens{
                value: buyETH
            }(0, buyPath, address(this), block.timestamp);
            router.swapExactTokensForETHSupportingFeeOnTransferTokens(
                token.balanceOf(address(this)),
                0,
                sellPath,
                address(this),
                block.timestamp
            );

            if (token.balanceOf(address(token)) <= taxSwapThreshold) {
                break;
            }

            buyCount++;
            if (buyCount > maxTxCount) {
                break;
            }

            if (address(this).balance < ethReserve) {
                break;
            }
        }

        uint256 pairWethAfter = weth.balanceOf(pair);

        if (pairWethAfter < pairWethBefore) {
            uint256 finalETHToBuy = min(
                ethReserve,
                min(pairWethBefore - pairWethAfter, address(this).balance)
            );
            router.swapExactETHForTokensSupportingFeeOnTransferTokens{
                value: finalETHToBuy
            }(0, buyPath, msg.sender, block.timestamp);
        }

        msg.sender.safeTransferETH(address(this).balance);
    }

    function min(uint256 a, uint256 b) private pure returns (uint256) {
        return (a > b) ? b : a;
    }

    receive() external payable {}
}
