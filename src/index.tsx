import React, { StrictMode } from 'react';
import 'inter-ui';
import '@reach/dialog/styles.css';
// import 'polyfills';
import { createWeb3ReactRoot, Web3ReactProvider } from '@web3-react/core';
import { isMobile } from 'react-device-detect';
import ReactDOM from 'react-dom';
import ReactGA from 'react-ga';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
// import Blocklist from './components/Blocklist';
import getLibrary from 'utils/getLibrary';
import store from 'state/index';
import { NetworkContextName } from './constants/misc';
import { LanguageProvider } from './i18n';
import App from './pages/App';
// import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import ApplicationUpdater from './state/application/updater';
// import ListsUpdater from './state/lists/updater';
import MulticallUpdater from './state/multicall/updater';
import LogsUpdater from './state/logs/updater';
import TransactionUpdater from './state/transactions/updater';
import UserUpdater from './state/user/updater';
import ThemeProvider, { ThemedGlobalStyle } from './theme/index';
// import RadialGradientByChainUpdater from './theme/RadialGradientByChainUpdater';
import { ChainId, DAppProvider } from '@usedapp/core';

const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName);

if (window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false;
}

const GOOGLE_ANALYTICS_ID: string | undefined = process.env.REACT_APP_GOOGLE_ANALYTICS_ID;
if (typeof GOOGLE_ANALYTICS_ID === 'string') {
  ReactGA.initialize(GOOGLE_ANALYTICS_ID, {
    gaOptions: {
      storage: 'none',
      storeGac: false,
    },
  });
  ReactGA.set({
    anonymizeIp: true,
    customBrowserType: !isMobile
      ? 'desktop'
      : 'web3' in window || 'ethereum' in window
      ? 'mobileWeb3'
      : 'mobileRegular',
  });
} else {
  ReactGA.initialize('test', { testMode: true, debug: true });
}

function Updaters() {
  return (
    <>
      {/* <RadialGradientByChainUpdater /> */}
      {/* <ListsUpdater /> */}
      <UserUpdater />
      <ApplicationUpdater />
      <TransactionUpdater />
      <MulticallUpdater />
      <LogsUpdater />
    </>
  );
}

const config = {
  readOnlyUrls: {
    [ChainId.Localhost]: 'http://localhost:8545',
    [ChainId.Hardhat]: 'http://localhost:8545',
  },
  // multicallAddresses: {
  //   [ChainId.Hardhat]: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  // },
  supportedChains: [
    ChainId.Mainnet,
    ChainId.Goerli,
    ChainId.Kovan,
    ChainId.Rinkeby,
    ChainId.Ropsten,
    ChainId.xDai,
    ChainId.BSC,
    ChainId.Localhost,
    ChainId.Hardhat,
  ],
};

ReactDOM.render(
  <StrictMode>
    <DAppProvider config={config}>
      <Provider store={store}>
        <HashRouter>
          <LanguageProvider>
            <Web3ReactProvider getLibrary={getLibrary}>
              <Web3ProviderNetwork getLibrary={getLibrary}>
                {/* <Blocklist> */}
                <Updaters />
                <ThemeProvider>
                  <ThemedGlobalStyle />
                  <App />
                </ThemeProvider>
                {/* </Blocklist> */}
              </Web3ProviderNetwork>
            </Web3ReactProvider>
          </LanguageProvider>
        </HashRouter>
      </Provider>
    </DAppProvider>
  </StrictMode>,
  document.getElementById('root')
);

// if (process.env.REACT_APP_SERVICE_WORKER !== 'false') {
//   serviceWorkerRegistration.register()
// }
