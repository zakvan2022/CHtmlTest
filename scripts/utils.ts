import hre from 'hardhat';
import RLP from 'rlp';
import { getAddress, keccak256, type Address } from 'viem';
import { getAccounts, getContracts } from './config';

export const predictDeploymentAddress = (
  sender: `0x${string}`,
  nonce: number
): `0x${string}` => {
  const inputArr = [sender, nonce];
  const rlpEncoded = RLP.encode(inputArr);
  const contractAddressLong = keccak256(rlpEncoded);
  return getAddress(`0x${contractAddressLong.substring(26)}`);
};

export const getPair = async (token: `0x${string}`) => {
  const { weth, uniswapV2Factory } = await getContracts();
  const pairAddress = await uniswapV2Factory.read.getPair([
    token,
    weth.address,
  ]) as Address;
  const pair = await hre.viem.getContractAt(
    'contracts/Helpers/UniswapInterfaces.sol:IUniswapV2Pair',
    pairAddress
  );
  return pair;
};
