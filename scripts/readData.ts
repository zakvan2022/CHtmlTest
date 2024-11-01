import hre from 'hardhat';
import { getAccounts } from './config';

async function main() {
  const publicClient = await hre.viem.getPublicClient();
  console.log(
    await publicClient.getStorageAt({
      address: '0xf756052E7d8dd4535B155604d2c8DC73467b3753',
      slot: '0x0e',
    })
  );
  const token = await hre.viem.getContractAt(
    'ZEUS',
    '0x6b2f324c9bce4f89c01e690a17ece7a6af5698a2'
  );
  console.log(
    await token.read.allowance([
      '0x5b8c5d13c76d427381fc52f5d6dfd545f270bdc2',
      '0x8275aD474D656c78b7F2a934f6CA0d61275Bd4FD',
    ])
  );
}
main();
