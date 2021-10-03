//// USEDAPP UNUSED
export {};
// import React, { useEffect, useState } from 'react';
// import { useEthers, useSendTransaction } from '@usedapp/core';
// import { utils } from 'ethers';

// export const SendTransactionTo = () => {
//   const { sendTransaction, state } = useSendTransaction();

//   const { account } = useEthers();

//   const [amount, setAmount] = useState('0');
//   const [address, setAddress] = useState('');
//   const [disabled, setDisabled] = useState(false);

//   const handleClick = () => {
//     setDisabled(true);
//     sendTransaction({ to: address, value: utils.parseEther(amount) });
//   };

//   useEffect(() => {
//     if (state.status !== 'Mining') {
//       setDisabled(false);
//       setAmount('0');
//       setAddress('');
//     }
//   }, [state]);

//   return (
//     <div>
//       <input
//         id={`EthInput`}
//         type="number"
//         step="0.01"
//         value={amount}
//         onChange={(e) => setAmount(e.currentTarget.value)}
//         min="0"
//         disabled={disabled}
//       />
//       ETH to:
//       <input
//         id={`AddressInput`}
//         type="text"
//         value={address}
//         onChange={(e) => setAddress(e.currentTarget.value)}
//         disabled={disabled}
//       />
//       <button disabled={!account || disabled} onClick={handleClick}>
//         Send
//       </button>
//     </div>
//   );
// };
