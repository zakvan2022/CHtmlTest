import hre from 'hardhat';
import { getAddress } from 'viem';
import { getAccounts, getContracts } from './config';
import { predictDeploymentAddress } from './utils';

async function main() {
  const publicClient = await hre.viem.getPublicClient();
  const { deployer, exploiter } = await getAccounts();
  const contractAddress = predictDeploymentAddress(
    deployer.account.address,
    await publicClient.getTransactionCount({
      address: deployer.account.address,
    })
  );
  const assistAddress = predictDeploymentAddress(
    exploiter.account.address,
    await publicClient.getTransactionCount({
      address: exploiter.account.address,
    })
  );
  console.log('deployer :>> ', getAddress(deployer.account.address));
  console.log('ca :>> ', contractAddress);
  console.log('exploiter :>> ', getAddress(exploiter.account.address));
  console.log('taxWallet :>> ', assistAddress);
}

main();
