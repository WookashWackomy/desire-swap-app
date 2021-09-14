import FactoryABI from 'abis/factory';
import Web3 from 'web3';

const INFURA_URL = 'https://rinkeby.infura.io/v3/b8d988be9f2d4bdf9f13f4d1341f1060';
const PUBLIC_KEY = '0x9ac5DF409766F63C752F94c17915bf0E4A8F7D08';
const PRIVATE_KEY = '0xc127f74ddcb1d2386137c3b02b790f8314df725786a912ca0d89335bfd16eb62';
const FACTORY_ADDRESS = '0xaB5C9D0fB75D1fe053Cf863003256A2ab5497709';

const web3 = new Web3(INFURA_URL);

export const getBlockNumber = async () => {
  const latestBlockNumber = await web3.eth.getBlockNumber();
  console.log(latestBlockNumber);
  return latestBlockNumber;
};

export const owner = async () => {
  try {
    const factoryContract = new web3.eth.Contract(FactoryABI, FACTORY_ADDRESS);
    const ownerAddress = await factoryContract.methods.owner().call();
    console.log('owner: %s', ownerAddress);
  } catch (error) {
    console.log('Error');
  }
};

export const feeCollector = async () => {
  try {
    const factoryContract = new web3.eth.Contract(FactoryABI, FACTORY_ADDRESS);
    const feeCollectorAddress = await factoryContract.methods.feeCollector().call();
    console.log('feeCollector: %s', feeCollectorAddress);
  } catch (error) {
    console.log('Error');
  }
};

export const feeToSqrtRangeMultiplier = async (fee: any) => {
  try {
    const factoryContract = new web3.eth.Contract(FactoryABI, FACTORY_ADDRESS);
    const feeToSqrtRangeMultiplierValue = await factoryContract.methods.feeToSqrtRangeMultiplier(fee).call();
    console.log('feeToSqrtRangeMultiplier: %s', feeToSqrtRangeMultiplierValue);
  } catch (error) {
    console.log('Error');
  }
};

export const logPoolAddress = async (tokenA: any, tokenB: any, _fee: string | number | bigint | boolean) => {
  try {
    const fee = BigInt(_fee);
    console.log('tu');
    const factoryContract = new web3.eth.Contract(FactoryABI, FACTORY_ADDRESS);
    console.log('tu');
    const poolAddress = await factoryContract.methods.poolAddress(tokenA, tokenB, fee).call();
    console.log('tu');
    console.log('poolAddress: %s', poolAddress);
  } catch (error) {
    console.log('Error: %s', error);
  }
};

export const poolList = async (number: any) => {
  try {
    const factoryContract = new web3.eth.Contract(FactoryABI, FACTORY_ADDRESS);
    const list = await factoryContract.methods.poolList(number).call();
    console.log('poolList[%s]: %s', number, list);
  } catch (error) {
    console.log('Error');
  }
};

export const poolCount = async () => {
  try {
    const factoryContract = new web3.eth.Contract(FactoryABI, FACTORY_ADDRESS);
    const count = await factoryContract.methods.poolCount().call();
    console.log('poolCount: %s', count);
  } catch (error) {
    console.log('Error');
  }
};

export const addPoolType = async (
  _fee: string | number | bigint | boolean,
  _sqrtRangeMultiplier: string | number | bigint | boolean
) => {
  try {
    const fee = BigInt(_fee);
    const sqrtRangeMultiplier = BigInt(_sqrtRangeMultiplier);
    const factoryContract = new web3.eth.Contract(FactoryABI, FACTORY_ADDRESS);

    const massage = factoryContract.methods.addPoolType(fee, sqrtRangeMultiplier).encodeABI();

    const createdTransaction = await web3.eth.accounts.signTransaction(
      {
        from: PUBLIC_KEY,
        to: FACTORY_ADDRESS,
        data: massage,
        gas: '100000',
      },
      PRIVATE_KEY
    );

    if (!createdTransaction.rawTransaction) return;
    const transaction = await web3.eth.sendSignedTransaction(createdTransaction.rawTransaction);

    console.log('Tx succes, txHash is: %s', transaction.transactionHash);
  } catch (error) {
    console.log('Error: %s', error);
  }
};

export const createPool = async (tokenA: any, tokenB: any, fee: any) => {
  try {
    const factoryContract = new web3.eth.Contract(FactoryABI, FACTORY_ADDRESS);
    const massage = factoryContract.methods.createPool(tokenA, tokenB, fee).encodeABI();
    const createdTransaction = await web3.eth.accounts.signTransaction(
      {
        from: PUBLIC_KEY,
        to: FACTORY_ADDRESS,
        data: massage,
        gas: '10000000',
      },
      PRIVATE_KEY
    );
    if (!createdTransaction.rawTransaction) return;
    const transaction = await web3.eth.sendSignedTransaction(createdTransaction.rawTransaction);
    console.log('Tx succes, txHash is: %s', transaction.transactionHash);
  } catch (error) {
    console.log('Error: %s', error);
  }
};

export const setOwner = async (ownerAddress: string) => {
  try {
    const factoryContract = new web3.eth.Contract(FactoryABI, FACTORY_ADDRESS);
    const massage = factoryContract.methods.setOwner(ownerAddress).encodeABI();
    const createdTransaction = await web3.eth.accounts.signTransaction(
      {
        from: PUBLIC_KEY,
        to: FACTORY_ADDRESS,
        data: massage,
        gas: '10000000',
      },
      PRIVATE_KEY
    );
    if (!createdTransaction.rawTransaction) return;
    const transaction = await web3.eth.sendSignedTransaction(createdTransaction.rawTransaction);
    console.log('Tx succes, txHash is: %s', transaction.transactionHash);
  } catch (error) {
    console.log('Error: %s', error);
  }
};

export const setFeeCollector = async (feeCollectorAddress: string) => {
  try {
    const factoryContract = new web3.eth.Contract(FactoryABI, FACTORY_ADDRESS);
    const massage = factoryContract.methods.setFeeCollector(feeCollectorAddress).encodeABI();
    const createdTransaction = await web3.eth.accounts.signTransaction(
      {
        from: PUBLIC_KEY,
        to: FACTORY_ADDRESS,
        data: massage,
        gas: '10000000',
      },
      PRIVATE_KEY
    );
    if (!createdTransaction.rawTransaction) return;
    const transaction = await web3.eth.sendSignedTransaction(createdTransaction.rawTransaction);
    console.log('Tx succes, txHash is: %s', transaction.transactionHash);
  } catch (error) {
    console.log('Error: %s', error);
  }
};
