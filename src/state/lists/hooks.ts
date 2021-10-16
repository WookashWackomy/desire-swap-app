import DEFAULT_TOKEN_LIST from './defaultTokenList.json';
import { TokenList } from '@uniswap/token-lists';
import { useMemo } from 'react';
import { useAppSelector } from 'state/hooks';
import sortByListPriority from 'utils/listSort';
import UNSUPPORTED_TOKEN_LIST from '../../constants/tokenLists/unsupported.tokenlist.json';
import BROKEN_LIST from '../../constants/tokenLists/broken.tokenlist.json';
import { AppState } from '../index';
import { UNSUPPORTED_LIST_URLS } from './../../constants/lists';
import { WrappedTokenInfo } from './wrappedTokenInfo';

const DEFAULT_TOKEN_LIST_HARDHAT_DEBUG = {
  ...DEFAULT_TOKEN_LIST,
  tokens: [
    ...DEFAULT_TOKEN_LIST.tokens,
    {
      name: 'TOKEN A',
      address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
      symbol: 'TOA',
      decimals: 18,
      chainId: 31337,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xd0A1E359811322d97991E03f863a0C30C2cF029C/logo.png',
    },
    {
      name: 'TOKEN B',
      address: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
      symbol: 'TOB',
      decimals: 18,
      chainId: 31337,
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xd0A1E359811322d97991E03f863a0C30C2cF029C/logo.png',
    },
  ],
};

export type TokenAddressMap = Readonly<{
  [chainId: number]: Readonly<{ [tokenAddress: string]: { token: WrappedTokenInfo; list: TokenList } }>;
}>;

type Mutable<T> = {
  -readonly [P in keyof T]: Mutable<T[P]>;
};

const listCache: WeakMap<TokenList, TokenAddressMap> | null =
  typeof WeakMap !== 'undefined' ? new WeakMap<TokenList, TokenAddressMap>() : null;

function listToTokenMap(list: TokenList): TokenAddressMap {
  const result = listCache?.get(list);
  if (result) return result;

  const map = list.tokens.reduce<Mutable<TokenAddressMap>>((tokenMap, tokenInfo) => {
    const token = new WrappedTokenInfo(tokenInfo, list);
    if (tokenMap[token.chainId]?.[token.address] !== undefined) {
      console.error(`Duplicate token! ${token.address}`);
      return tokenMap;
    }
    if (!tokenMap[token.chainId]) tokenMap[token.chainId] = {};
    tokenMap[token.chainId][token.address] = {
      token,
      list,
    };
    return tokenMap;
  }, {}) as TokenAddressMap;
  listCache?.set(list, map);
  return map;
}

const TRANSFORMED_DEFAULT_TOKEN_LIST = listToTokenMap(DEFAULT_TOKEN_LIST_HARDHAT_DEBUG);

export function useAllLists(): AppState['lists']['byUrl'] {
  return useAppSelector((state) => state.lists.byUrl);
}

/**
 * Combine the tokens in map2 with the tokens on map1, where tokens on map1 take precedence
 * @param map1 the base token map
 * @param map2 the map of additioanl tokens to add to the base map
 */
export function combineMaps(map1: TokenAddressMap, map2: TokenAddressMap): TokenAddressMap {
  const chainIds = Object.keys(
    Object.keys(map1)
      .concat(Object.keys(map2))
      .reduce<{ [chainId: string]: true }>((memo, value) => {
        memo[value] = true;
        return memo;
      }, {})
  ).map((id) => parseInt(id));

  return chainIds.reduce<Mutable<TokenAddressMap>>((memo, chainId) => {
    memo[chainId] = {
      ...map2[chainId],
      // map1 takes precedence
      ...map1[chainId],
    };
    return memo;
  }, {}) as TokenAddressMap;
}

// merge tokens contained within lists from urls
function useCombinedTokenMapFromUrls(urls: string[] | undefined): TokenAddressMap {
  const lists = useAllLists();
  return useMemo(() => {
    if (!urls) return {};
    return (
      urls
        .slice()
        // sort by priority so top priority goes last
        .sort(sortByListPriority)
        .reduce((allTokens, currentUrl) => {
          const current = lists[currentUrl]?.current;
          if (!current) return allTokens;
          try {
            return combineMaps(allTokens, listToTokenMap(current));
          } catch (error) {
            console.error('Could not show token list due to error', error);
            return allTokens;
          }
        }, {})
    );
  }, [lists, urls]);
}

// filter out unsupported lists
export function useActiveListUrls(): string[] | undefined {
  return useAppSelector((state) => state.lists.activeListUrls)?.filter((url) => !UNSUPPORTED_LIST_URLS.includes(url));
}

export function useInactiveListUrls(): string[] {
  const lists = useAllLists();
  const allActiveListUrls = useActiveListUrls();
  return Object.keys(lists).filter((url) => !allActiveListUrls?.includes(url) && !UNSUPPORTED_LIST_URLS.includes(url));
}

// get all the tokens from active lists, combine with local default tokens
export function useCombinedActiveList(): TokenAddressMap {
  const activeListUrls = useActiveListUrls();
  const activeTokens = useCombinedTokenMapFromUrls(activeListUrls);
  return combineMaps(activeTokens, TRANSFORMED_DEFAULT_TOKEN_LIST);
}

// list of tokens not supported on interface for various reasons, used to show warnings and prevent swaps and adds
export function useUnsupportedTokenList(): TokenAddressMap {
  // get hard-coded broken tokens
  const brokenListMap = useMemo(() => listToTokenMap(BROKEN_LIST), []);

  // get hard-coded list of unsupported tokens
  const localUnsupportedListMap = useMemo(() => listToTokenMap(UNSUPPORTED_TOKEN_LIST), []);

  // get dynamic list of unsupported tokens
  const loadedUnsupportedListMap = useCombinedTokenMapFromUrls(UNSUPPORTED_LIST_URLS);

  // format into one token address map
  return useMemo(
    () => combineMaps(brokenListMap, combineMaps(localUnsupportedListMap, loadedUnsupportedListMap)),
    [brokenListMap, localUnsupportedListMap, loadedUnsupportedListMap]
  );
}
export function useIsListActive(url: string): boolean {
  const activeListUrls = useActiveListUrls();
  return Boolean(activeListUrls?.includes(url));
}
