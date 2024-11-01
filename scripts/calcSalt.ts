import { getAddress, keccak256, encodePacked } from 'viem';
import { predictDeploymentAddress } from './utils';

async function main() {
  const factoryAddress = '0xE18Ea30f838326a27eF20281422c5F063Da9b3cd';
  const bytecodeHash =
    '0x838f2b92edf4ebc184ce97cbf2bfec760a92f9a4b7992c8f4fb008802b1681e4';
  const startsWith = '0x42069';
  const endsWith = '';
  let salt = 0n;
  do {
    const address =
      '0x' +
      keccak256(
        encodePacked(
          ['bytes1', 'address', 'uint256', 'bytes32'],
          ['0xff', factoryAddress, salt, bytecodeHash]
        )
      ).slice(26);
    console.log(salt, address);
    if (
      address.slice(0, startsWith.length).toLowerCase() == startsWith &&
      address.slice(address.length - endsWith.length).toLowerCase() == endsWith
    ) {
      break;
    }

  } while (++salt);
}

main();
