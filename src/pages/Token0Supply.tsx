// USEDAPP UNUSED
export {};
// import { BigNumber, Contract, utils } from 'ethers';
// import LiquidityManagerHelperABI from 'abis/LiquidityManagerHelper.json';
// import LiquidityManagerABI from 'abis/LiquidityManager.json';
// import TestERC20TokenABI from 'abis/TestERC20Token.json';
// import { useContractCall, useContractFunction, useEthers } from '@usedapp/core';
// import { useEffect, useState } from 'react';
// // import Web3 from 'web3';
// // import { AbiItem } from 'web3-utils';

// const LiquidityManagerHelper = new utils.Interface(LiquidityManagerHelperABI);
// const LiquidityManagerAddress = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
// const liquidityManagerHelperAddress = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
// const poolAddress = '0xa16E02E87b7454126E5E10d957A927A7F5B5d2be';
// const token0Address = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';
// const token1Address = '0x0165878A594ca255338adfa4d48449f69242Eb8F';

// const LiquidityManager = new utils.Interface(LiquidityManagerABI);
// const LiquidityManagerContract = new Contract(LiquidityManagerAddress, LiquidityManager);

// export const feeZDupy = BigNumber.from('500000000000000');

// const useSupply = (
//   contract: Contract,
//   token0: string,
//   token1: string,
//   fee: BigNumber,
//   lowestRangeIndex: number,
//   highestRangeIndex: number,
//   liqToAdd: BigNumber,
//   amount0Max: BigNumber,
//   amount1Max: BigNumber,
//   recipient: string,
//   deadline: BigNumber,
//   isSupplying: boolean,
//   setIsSupplying: (val: boolean) => void
// ) => {
//   const [startedSupply, setStartedSupply] = useState(false);
//   const { state, send } = useContractFunction(contract as any, 'supply');

//   useEffect(() => {
//     if (!isSupplying || startedSupply) return;

//     const supplyParams = {
//       token0,
//       token1,
//       fee: fee.toString(),
//       lowestRangeIndex,
//       highestRangeIndex,
//       liqToAdd: liqToAdd.toString(),
//       amount0Max: amount0Max.toString(),
//       amount1Max: amount1Max.toString(),
//       recipient,
//       deadline: deadline.toString(),
//     };
//     setStartedSupply(true);
//     send(supplyParams).then(() => {
//       console.log({ state });
//       setIsSupplying(false);
//       setStartedSupply(false);
//     });
//   }, [
//     contract,
//     token0,
//     token1,
//     fee,
//     lowestRangeIndex,
//     highestRangeIndex,
//     liqToAdd,
//     amount0Max,
//     amount1Max,
//     recipient,
//     deadline,
//     isSupplying,
//     startedSupply,
//     setStartedSupply,
//   ]);

//   return { state };
// };

// const useApproveTokens = (isApproving: boolean, setIsApproving: (val: boolean) => void) => {
//   const tokenTestERC20Interface = new utils.Interface(TestERC20TokenABI);

//   const token0Contract = new Contract(token0Address, tokenTestERC20Interface);
//   const token1Contract = new Contract(token1Address, tokenTestERC20Interface);

//   const maxNumber = BigNumber.from('115792089237316195423570985008687907853269984665640564039457584007913129639935');

//   const { state: stateToken0, send: sendToken0 } = useContractFunction(token0Contract as any, 'approve');
//   const { state: stateToken1, send: sendToken1 } = useContractFunction(token1Contract as any, 'approve');

//   //   const approveBothTokensAsync = async () => {
//   //     await sendToken0(LiquidityManagerAddress,maxNumber.toString()).then((retObj) => {
//   //         console.log({ retObj });
//   //       });
//   //       await sendToken1(LiquidityManagerAddress,maxNumber.toString()).then((retObj) => {
//   //         console.log({ retObj });
//   //       });
//   //       setIsApproving(false);
//   //   }

//   useEffect(() => {
//     if (!isApproving) return;
//     (async () => {
//       await sendToken0(LiquidityManagerAddress, maxNumber.toString()).then((retObj) => {
//         console.log({ retObj });
//       });
//       await sendToken1(LiquidityManagerAddress, maxNumber.toString()).then((retObj) => {
//         console.log({ retObj });
//       });
//       setIsApproving(false);
//     })();
//   }, [isApproving, setIsApproving]);

//   return [stateToken0, stateToken1];
// };

// export const Token0Supply = () => {
//   const { account } = useEthers();
//   const [amount0, setAmount0] = useState(BigNumber.from('10000000'));
//   const [lowestRangeIndex, setLowestRangeIndex] = useState(0);
//   const [highestRangeIndex, setHighestRangeIndex] = useState(0);
//   const [isSupplying, setIsSupplying] = useState(false);
//   const [isApproving, setIsApproving] = useState(false);
//   const [token0SupplyResult, setToken0SupplyResult] = useState({
//     liqToAdd: BigNumber.from(0),
//     amount1: BigNumber.from(0),
//   });

//   const ret: any = useContractCall({
//     abi: LiquidityManagerHelper,
//     address: liquidityManagerHelperAddress,
//     method: 'token0Supply',
//     args: [poolAddress, amount0.toString(), lowestRangeIndex, highestRangeIndex],
//   });

//   useEffect(() => {
//     if (ret) setToken0SupplyResult(ret);
//   }, [ret]);

//   const [stateToken0, stateToken1] = useApproveTokens(isApproving, setIsApproving);

//   const supplyResult = useSupply(
//     LiquidityManagerContract,
//     token0Address,
//     token1Address,
//     feeZDupy,
//     lowestRangeIndex,
//     highestRangeIndex,
//     ret?.liqToAdd,
//     amount0.mul(BigNumber.from(11)).div(BigNumber.from(10)),
//     ret?.amount1?.mul(BigNumber.from(11)).div(BigNumber.from(10)),
//     account as string,
//     BigNumber.from('999999999999999999999'),
//     isSupplying,
//     setIsSupplying
//   );

//   const startSupply = () => {
//     setIsSupplying(true);
//   };

//   const onApproveTokens = () => {
//     setIsApproving(true);
//   };

//   return (
//     <div style={{ display: 'flex', flexDirection: 'column' }}>
//       <button onClick={onApproveTokens}> Approve tokens </button>
//       <div>{JSON.stringify({ stateToken0, stateToken1 }, null, '\t')};</div>
//       <div>
//         amount0:
//         <input
//           type="text"
//           value={amount0.toString()}
//           onChange={(e) => setAmount0(BigNumber.from(e.currentTarget.value))}
//           min="0"
//         />
//       </div>
//       <div>
//         lowestRangeIndex:
//         <input
//           type="number"
//           value={lowestRangeIndex}
//           onChange={(e) => setLowestRangeIndex(parseInt(e.currentTarget.value))}
//         />
//       </div>
//       <div>
//         highestRangeIndex:
//         <input
//           type="number"
//           value={highestRangeIndex}
//           onChange={(e) => setHighestRangeIndex(parseInt(e.currentTarget.value))}
//         />
//       </div>
//       <div>
//         {JSON.stringify({
//           liqToAdd: token0SupplyResult.liqToAdd.toString(),
//           amount1: token0SupplyResult.amount1.toString(),
//         })}
//       </div>
//       <div>
//         <button onClick={startSupply}>Supply</button>
//         <div>{JSON.stringify({ isSupplying })}</div>
//         Supply result:
//         {JSON.stringify(supplyResult, null, '\t')}
//       </div>
//     </div>
//   );
// };

// // export const Token0Supply = () => {
// //   const [returnObj, setReturnObj] = useState();

// //   const getSupply = async () => {
// //     try {
// //       const web3 = new Web3('http://localhost:8545');
// //       const LiquidityManagerHelperContract = new web3.eth.Contract(
// //         LiquidityManagerHelperABI as AbiItem[],
// //         liquidityManagerHelperAddress
// //       );
// //       const returnValue = await LiquidityManagerHelperContract.methods
// //         .token0Supply(poolAddress, '10000000', '-10', '10')
// //         .call();
// //       setReturnObj(returnValue);
// //     } catch (error) {
// //       console.log({ error, LiquidityManagerHelperABI });
// //     }
// //   };

// //   return (
// //     <div>
// //       <button onClick={() => getSupply()}>refresh token 0 supply</button>
// //       {JSON.stringify(returnObj)}
// //     </div>
// //   );
// // };
