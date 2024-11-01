import type { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox-viem';
import 'dotenv/config';

const MNEMONIC = process.env.MNEMONIC!;
const privateKey = process.env.PRIVATE_KEY!;

const accounts = {
  mnemonic: MNEMONIC,
}
// const accounts = [privateKey];

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.16',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: MNEMONIC,
      },
      chains: {
        56: {
          hardforkHistory: {
            london: 39980770,
          },
        },
      },
      forking: {
        // url: 'https://ethereum-rpc.publicnode.com',
        url: 'https://eth-mainnet.g.alchemy.com/v2/NjQKcW84LgyTNGPA2TGk45b7ZTIcZWb5',
        blockNumber: 20663762,
      },
    },
    sepolia: {
      // url: 'https://ethereum-sepolia-rpc.publicnode.com',
      url: 'https://eth-sepolia.g.alchemy.com/v2/NjQKcW84LgyTNGPA2TGk45b7ZTIcZWb5',
      accounts,
    },
    mainnet: {
      url: 'https://eth-mainnet.g.alchemy.com/v2/NjQKcW84LgyTNGPA2TGk45b7ZTIcZWb5',
      accounts,
    },
    base: {
      url: 'https://mainnet.base.org',
      accounts,
    },
    bsc: {
      url: 'https://bsc-rpc.publicnode.com',
      accounts,
    },
  },
  etherscan: {
    enabled: true,
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY!,
      sepolia: process.env.ETHERSCAN_API_KEY!,
      base: process.env.BASESCAN_API_KEY!,
      bsc: process.env.BSCSCAN_API_KEY!,
    },
  },
  sourcify: {
    enabled: false,
  },
  mocha: {
    timeout: 3600000,
  },
};

export default config;
