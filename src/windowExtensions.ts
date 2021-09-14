declare global {
  interface Window {
    // ethereum?: {
    //   isMetaMask: boolean;
    //   autoRefreshOnNetworkChange: boolean;
    //   on: any; // TODO type () => void;
    //   removeListener: any; //TODO type
    // };
    ethereum: any;
    web3: {
      prop: string;
    };
  }
}

// required being as a module fix
export {};
