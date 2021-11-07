/* eslint-disable complexity */
import { useCallback, useMemo, useState } from 'react';
import { useV3PositionFromTokenId } from 'hooks/useV3Positions';
import { Redirect, RouteComponentProps } from 'react-router-dom';
import { WETH9_EXTENDED } from '../../constants/tokens';
import { calculateGasMargin } from '../../utils/calculateGasMargin';
import AppBody from '../AppBody';
import { BigNumber } from '@ethersproject/bignumber';
import { useDerivedV3BurnInfo } from 'state/burn/v3/hooks';
import { RowBetween, RowFixed } from 'components/Row';
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal';
import { AutoColumn } from 'components/Column';
import { ButtonConfirmed, ButtonPrimary } from 'components/Button';
import { LightCard } from 'components/Card';
import { Text } from 'rebass';
import CurrencyLogo from 'components/CurrencyLogo';
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount';
import { useV3NFTPositionManagerContract } from 'hooks/useContract';
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks';
import useTransactionDeadline from 'hooks/useTransactionDeadline';
import { useActiveWeb3React } from 'hooks/web3';
import { TransactionResponse } from '@ethersproject/providers';
import { useTransactionAdder } from 'state/transactions/hooks';
import { Percent } from 'sdkCore/index';
import { TYPE } from 'theme';
import { Wrapper } from './styled';
import Loader from 'components/Loader';
import DoubleCurrencyLogo from 'components/DoubleLogo';
import { AddRemoveTabs } from 'components/NavigationTabs';
import RangeBadge from 'components/Badge/RangeBadge';
import Toggle from 'components/Toggle';
import { t, Trans } from '@lingui/macro';
import { SupportedChainId } from 'constants/chains';
import { abi as DesireSwapV0PoolABI } from 'abis/DesireSwapV0Pool.json';
import { Interface } from '@ethersproject/abi';
import { toHex } from 'v3sdk/utils';

const DEFAULT_REMOVE_V3_LIQUIDITY_SLIPPAGE_TOLERANCE = new Percent(5, 100);

// redirect invalid tokenIds
export default function RemoveLiquidityV3({
  location,
  match: {
    params: { tokenId, poolAddress },
  },
}: RouteComponentProps<{ tokenId: string; poolAddress: string }>) {
  const parsedTokenId = useMemo(() => {
    try {
      return BigNumber.from(tokenId);
    } catch {
      return null;
    }
  }, [tokenId]);

  if (parsedTokenId === null || parsedTokenId.eq(0)) {
    return <Redirect to={{ ...location, pathname: '/pool' }} />;
  }

  return <Remove tokenId={parsedTokenId} poolAddress={poolAddress} />;
}
function Remove({ tokenId, poolAddress }: { tokenId: BigNumber; poolAddress: string }) {
  const { position } = useV3PositionFromTokenId(poolAddress, tokenId);
  const { account, chainId, library } = useActiveWeb3React();

  // flag for receiving WETH
  const [receiveWETH, setReceiveWETH] = useState(false);

  const {
    position: positionSDK,
    liquidityPercentage,
    liquidityValue0,
    liquidityValue1,
    outOfRange,
    error,
  } = useDerivedV3BurnInfo(position, receiveWETH);

  const removed = position?.liquidity?.eq(0);

  // boilerplate for the slider

  const deadline = useTransactionDeadline(); // custom from users settings
  const allowedSlippage = useUserSlippageToleranceWithDefault(DEFAULT_REMOVE_V3_LIQUIDITY_SLIPPAGE_TOLERANCE); // custom from users

  const [showConfirm, setShowConfirm] = useState(false);
  const [attemptingTxn, setAttemptingTxn] = useState(false);
  const [txnHash, setTxnHash] = useState<string | undefined>();
  const addTransaction = useTransactionAdder();
  const positionManager = useV3NFTPositionManagerContract();
  const burn = useCallback(async () => {
    setAttemptingTxn(true);
    if (
      // !positionManager ||
      !liquidityValue0 ||
      !liquidityValue1 ||
      !position?.poolAddress ||
      !deadline ||
      !account ||
      !chainId ||
      !positionSDK ||
      !liquidityPercentage ||
      !library
    ) {
      return;
    }

    const calldata = new Interface(DesireSwapV0PoolABI).encodeFunctionData('burn', [account, tokenId]);

    const txn = {
      to: position?.poolAddress,
      data: calldata,
      value: toHex(0),
    };

    library
      .getSigner()
      .estimateGas(txn)
      .then((estimate) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(chainId, estimate),
        };

        return library
          .getSigner()
          .sendTransaction(newTxn)
          .then((response: TransactionResponse) => {
            setTxnHash(response.hash);
            setAttemptingTxn(false);
            addTransaction(response, {
              summary: t`Remove ${liquidityValue0.currency.symbol}/${liquidityValue1.currency.symbol} V3 liquidity`,
            });
          });
      })
      .catch((error) => {
        setAttemptingTxn(false);
        console.error(error);
      });
  }, [
    tokenId,
    liquidityValue0,
    liquidityValue1,
    deadline,
    allowedSlippage,
    account,
    addTransaction,
    positionManager,
    chainId,
    library,
    liquidityPercentage,
    positionSDK,
  ]);

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false);
    setAttemptingTxn(false);
    setTxnHash('');
  }, [txnHash]);

  const pendingText = `Removing ${liquidityValue0?.toSignificant(6)} ${
    liquidityValue0?.currency?.symbol
  } and ${liquidityValue1?.toSignificant(6)} ${liquidityValue1?.currency?.symbol}`;

  function modalHeader() {
    return (
      <AutoColumn gap={'sm'} style={{ padding: '16px' }}>
        <RowBetween align="flex-end">
          <Text fontSize={16} fontWeight={500}>
            <Trans>Pooled {liquidityValue0?.currency?.symbol}:</Trans>
          </Text>
          <RowFixed>
            <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
              {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}
            </Text>
            <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={liquidityValue0?.currency} />
          </RowFixed>
        </RowBetween>
        <RowBetween align="flex-end">
          <Text fontSize={16} fontWeight={500}>
            <Trans>Pooled {liquidityValue1?.currency?.symbol}:</Trans>
          </Text>
          <RowFixed>
            <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
              {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}
            </Text>
            <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={liquidityValue1?.currency} />
          </RowFixed>
        </RowBetween>
        <ButtonPrimary mt="16px" onClick={burn}>
          <Trans>Remove</Trans>
        </ButtonPrimary>
      </AutoColumn>
    );
  }

  const onOptimisticChain = chainId && [SupportedChainId.OPTIMISM, SupportedChainId.OPTIMISTIC_KOVAN].includes(chainId);
  const showCollectAsWeth = Boolean(
    !onOptimisticChain &&
      liquidityValue0?.currency &&
      liquidityValue1?.currency &&
      (liquidityValue0.currency.isNative ||
        liquidityValue1.currency.isNative ||
        liquidityValue0.currency.wrapped.equals(WETH9_EXTENDED[liquidityValue0.currency.chainId]) ||
        liquidityValue1.currency.wrapped.equals(WETH9_EXTENDED[liquidityValue1.currency.chainId]))
  );
  return (
    <AutoColumn>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txnHash ?? ''}
        content={() => (
          <ConfirmationModalContent
            title={<Trans>Remove Liquidity</Trans>}
            onDismiss={handleDismissConfirmation}
            topContent={modalHeader}
          />
        )}
        pendingText={pendingText}
      />
      <AppBody>
        <AddRemoveTabs
          creating={false}
          adding={false}
          positionID={tokenId.toString()}
          defaultSlippage={DEFAULT_REMOVE_V3_LIQUIDITY_SLIPPAGE_TOLERANCE}
        />
        <Wrapper>
          {position ? (
            <AutoColumn gap="lg">
              <RowBetween>
                <RowFixed>
                  <DoubleCurrencyLogo
                    currency0={liquidityValue0?.currency}
                    currency1={liquidityValue1?.currency}
                    size={20}
                    margin={true}
                  />
                  <TYPE.label
                    ml="10px"
                    fontSize="20px"
                  >{`${liquidityValue0?.currency?.symbol}/${liquidityValue1?.currency?.symbol}`}</TYPE.label>
                </RowFixed>
                <RangeBadge removed={removed} inRange={!outOfRange} />
              </RowBetween>
              <LightCard>
                <AutoColumn gap="md">
                  <RowBetween>
                    <Text fontSize={16} fontWeight={500}>
                      <Trans>Pooled {liquidityValue0?.currency?.symbol}:</Trans>
                    </Text>
                    <RowFixed>
                      <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                        {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}
                      </Text>
                      <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={liquidityValue0?.currency} />
                    </RowFixed>
                  </RowBetween>
                  <RowBetween>
                    <Text fontSize={16} fontWeight={500}>
                      <Trans>Pooled {liquidityValue1?.currency?.symbol}:</Trans>
                    </Text>
                    <RowFixed>
                      <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                        {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}
                      </Text>
                      <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={liquidityValue1?.currency} />
                    </RowFixed>
                  </RowBetween>
                </AutoColumn>
              </LightCard>

              {showCollectAsWeth && (
                <RowBetween>
                  <TYPE.main>
                    <Trans>Collect as WETH</Trans>
                  </TYPE.main>
                  <Toggle
                    id="receive-as-weth"
                    isActive={receiveWETH}
                    toggle={() => setReceiveWETH((receiveWETH) => !receiveWETH)}
                  />
                </RowBetween>
              )}

              <div style={{ display: 'flex' }}>
                <AutoColumn gap="12px" style={{ flex: '1' }}>
                  <ButtonConfirmed
                    confirmed={false}
                    disabled={removed || !liquidityValue0}
                    onClick={() => setShowConfirm(true)}
                  >
                    {removed ? <Trans>Closed</Trans> : error ?? <Trans>Remove</Trans>}
                  </ButtonConfirmed>
                </AutoColumn>
              </div>
            </AutoColumn>
          ) : (
            <Loader />
          )}
        </Wrapper>
      </AppBody>
    </AutoColumn>
  );
}
