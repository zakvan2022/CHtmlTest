set MNEMONIC in .env
First wallet of the mnemonic will be used as the token deployer.
Second wallet of the mnemonic will be used as the assist contract deployer.

To calculate contract address and assist contract address run:

```
npm run calc
```

Update tax wallet address in contracts/Main.sol

To test

```
npx hardhat test
```


To test a new contract
- Paste contract in Main.sol
- Update tax wallet address in contracts/Main.sol
- Update function names in test/test.ts
- Run test
  ```
  npx hardhat test
  ```
