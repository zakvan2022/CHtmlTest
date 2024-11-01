import hre from 'hardhat';

const ROUTERS: Record<number, `0x${string}`> = {
  31337: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  1: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  56: '0x10ed43c718714eb63d5aa57b78b54704e256024e',
  8453: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
  11155111: '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008',
};

export const getAccounts = async () => {
  const walletClients = await hre.viem.getWalletClients();
  return {
    deployer: walletClients[0],
    exploiter: walletClients[1],
    buyer: walletClients[2],
  };
};

export const getContracts = async () => {
  const publicClient = await hre.viem.getPublicClient();
  const chainId = await publicClient.getChainId();
  const routerAddress = ROUTERS[chainId];
  const uniswapV2Router02 = await hre.viem.getContractAt(
    'contracts/Helpers/UniswapInterfaces.sol:IUniswapV2Router02',
    routerAddress
  );
  const wethAddress = await uniswapV2Router02.read.WETH();
  const weth = await hre.viem.getContractAt(
    'contracts/Helpers/ERC20.sol:ERC20',
    wethAddress
  );
  const factoryAddress = await uniswapV2Router02.read.factory();
  const uniswapV2Factory = await hre.viem.getContractAt(
    'contracts/Helpers/UniswapInterfaces.sol:IUniswapV2Factory',
    factoryAddress
  );
  return {
    uniswapV2Router02,
    weth,
    uniswapV2Factory,
  };
};
