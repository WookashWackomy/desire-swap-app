/* eslint-disable complexity */
import JSBI from 'jsbi';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { TransactionResponse } from '@ethersproject/providers';
import { Currency, CurrencyAmount, Percent } from 'sdkCore/index';
import { AlertTriangle } from 'react-feather';
import ReactGA from 'react-ga';
import { RouteComponentProps } from 'react-router-dom';
import { Text } from 'rebass';
import { ThemeContext } from 'styled-components/macro';
import { AddLiquidityNetworkAlert } from 'components/NetworkAlert/AddLiquidityNetworkAlert';
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter';
import { Trans, t } from '@lingui/macro';
import {
  useV3MintState,
  useV3MintActionHandlers,
  useRangeHopCallbacks,
  useV3DerivedMintInfo,
} from 'state/mint/v3/hooks';
import { FeeAmount, NonfungiblePositionManager, toHex } from 'v3sdk/index';
import { useV3PositionFromTokenId } from 'hooks/useV3Positions';
import { useDerivedPositionInfo } from 'hooks/useDerivedPositionInfo';
import { PositionPreview } from 'components/PositionPreview';
import FeeSelector from 'components/FeeSelector';
import RangeSelector from 'components/RangeSelector';
import PresetsButtons from 'components/RangeSelector/PresetsButtons';
import RateToggle from 'components/RateToggle';
import { BigNumber } from '@ethersproject/bignumber';
import { AddRemoveTabs } from 'components/NavigationTabs';
import HoverInlineText from 'components/HoverInlineText';
import { SwitchLocaleLink } from 'components/SwitchLocaleLink';
import LiquidityChartRangeInput from 'components/LiquidityChartRangeInput';
// import { ZERO_PERCENT } from '../../constants/misc';
import { DESIRE_SWAP_V0_LIQUIDITY_MANAGER_ADDRESS } from '../../constants/addresses';
import { WETH9_EXTENDED } from '../../constants/tokens';
import { useArgentWalletContract } from '../../hooks/useArgentWalletContract';
import { useV3NFTPositionManagerContract } from '../../hooks/useContract';
import { ButtonError, ButtonLight, ButtonPrimary, ButtonText, ButtonYellow } from '../../components/Button';
import { YellowCard, OutlineCard, BlueCard } from '../../components/Card';
import { AutoColumn } from '../../components/Column';
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal';
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import Row, { RowBetween, RowFixed, AutoRow } from '../../components/Row';
import { useIsSwapUnsupported } from '../../hooks/useIsSwapUnsupported';
import { useUSDCValue } from '../../hooks/useUSDCPrice';
// import approveAmountCalldata from '../../utils/approveAmountCalldata';
import { calculateGasMargin } from '../../utils/calculateGasMargin';
import { Review } from './Review';
import { useActiveWeb3React } from '../../hooks/web3';
import { useCurrency } from '../../hooks/Tokens';
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback';
import useTransactionDeadline from '../../hooks/useTransactionDeadline';
import { useWalletModalToggle } from '../../state/application/hooks';
import { Field, Bound } from '../../state/mint/v3/actions';
import { useTransactionAdder } from '../../state/transactions/hooks';
import { useIsExpertMode } from '../../state/user/hooks';
// import { useIsExpertMode, useUserSlippageToleranceWithDefault } from '../../state/user/hooks';
import { TYPE, ExternalLink } from '../../theme';
import { maxAmountSpend } from '../../utils/maxAmountSpend';
import { Dots } from '../Pool/styleds';
import { currencyId } from '../../utils/currencyId';
import {
  DynamicSection,
  CurrencyDropdown,
  StyledInput,
  Wrapper,
  ScrollablePage,
  ResponsiveTwoColumns,
  PageWrapper,
  StackedContainer,
  StackedItem,
  RightContainer,
  MediumOnly,
  HideMedium,
} from './styled';
import { SupportedChainId, CHAIN_INFO } from 'constants/chains';
import OptimismDowntimeWarning from 'components/OptimismDowntimeWarning';
import { Contract } from 'ethers';
import { Interface } from '@ethersproject/abi';
import LiquidityManagerABI from 'abis/LiquidityManager.json';

const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10_000);

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB, feeAmount: feeAmountFromUrl, tokenId },
  },
  history,
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string; feeAmount?: string; tokenId?: string }>) {
  const { account, chainId, library } = useActiveWeb3React();
  const theme = useContext(ThemeContext);
  const toggleWalletModal = useWalletModalToggle(); // toggle wallet when disconnected
  const expertMode = useIsExpertMode();
  const addTransaction = useTransactionAdder();
  const positionManager = useV3NFTPositionManagerContract();

  // check for existing position if tokenId in url
  const { position: existingPositionDetails, loading: positionLoading } = useV3PositionFromTokenId(
    //TODO podmienić zwracanie pozycji
    tokenId ? BigNumber.from(tokenId) : undefined
  );
  const hasExistingPosition = !!existingPositionDetails && !positionLoading;
  const { position: existingPosition } = useDerivedPositionInfo(existingPositionDetails);

  // fee selection from url
  const feeAmount: FeeAmount | undefined =
    feeAmountFromUrl && Object.values(FeeAmount).includes(parseFloat(feeAmountFromUrl))
      ? parseFloat(feeAmountFromUrl)
      : undefined;

  const baseCurrency = useCurrency(currencyIdA);
  const currencyB = useCurrency(currencyIdB);
  // prevent an error if they input ETH/WETH
  const quoteCurrency =
    baseCurrency && currencyB && baseCurrency.wrapped.equals(currencyB.wrapped) ? undefined : currencyB;

  // mint state
  const { independentField, typedValue, startPriceTypedValue } = useV3MintState();

  const {
    pool,
    ticks,
    dependentField,
    price,
    pricesAtTicks,
    parsedAmounts,
    currencyBalances,
    position,
    noLiquidity,
    currencies,
    errorMessage,
    invalidPool,
    invalidRange,
    outOfRange,
    depositADisabled,
    depositBDisabled,
    invertPrice,
    ticksAtLimit,
    liquidityToAdd,
  } = useV3DerivedMintInfo(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    existingPosition
  );

  const { onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput, onStartPriceInput } =
    useV3MintActionHandlers(noLiquidity);

  const isValid = !errorMessage && !invalidRange;

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false); // clicked confirm

  // capital efficiency warning
  const [showCapitalEfficiencyWarning, setShowCapitalEfficiencyWarning] = useState(false);

  useEffect(() => setShowCapitalEfficiencyWarning(false), [baseCurrency, quoteCurrency, feeAmount]);

  // txn values
  const deadline = useTransactionDeadline(); // custom from users settings

  const [txHash, setTxHash] = useState<string>('');

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  };

  const usdcValues = {
    [Field.CURRENCY_A]: useUSDCValue(parsedAmounts[Field.CURRENCY_A]),
    [Field.CURRENCY_B]: useUSDCValue(parsedAmounts[Field.CURRENCY_B]),
  };

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field]),
      };
    },
    {}
  );

  const atMaxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0'),
      };
    },
    {}
  );

  const argentWalletContract = useArgentWalletContract() as unknown as Contract;

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(
    argentWalletContract ? undefined : parsedAmounts[Field.CURRENCY_A],
    chainId ? DESIRE_SWAP_V0_LIQUIDITY_MANAGER_ADDRESS[chainId] : undefined
  );
  const [approvalB, approveBCallback] = useApproveCallback(
    argentWalletContract ? undefined : parsedAmounts[Field.CURRENCY_B],
    chainId ? DESIRE_SWAP_V0_LIQUIDITY_MANAGER_ADDRESS[chainId] : undefined
  );

  // const allowedSlippage = useUserSlippageToleranceWithDefault(
  //   outOfRange ? ZERO_PERCENT : DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE
  // );

  // only called on optimism, atm
  async function onCreate() {
    if (!chainId || !library) return;

    if (!positionManager || !baseCurrency || !quoteCurrency) {
      return;
    }

    if (position && account && deadline) {
      const { calldata, value } = NonfungiblePositionManager.createCallParameters(position.pool);

      const txn: { to: string; data: string; value: string } = {
        to: DESIRE_SWAP_V0_LIQUIDITY_MANAGER_ADDRESS[chainId],
        data: calldata,
        value,
      };

      setAttemptingTxn(true);

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
              setAttemptingTxn(false);
              addTransaction(response, {
                summary: t`Create ${baseCurrency?.symbol}/${quoteCurrency?.symbol} V3 pool`,
              });
              // dont set txn hash as we dont want submitted txn screen for create
              ReactGA.event({
                category: 'Liquidity',
                action: 'Create',
                label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join('/'),
              });
            });
        })
        .catch((error) => {
          console.error('Failed to send transaction', error);
          setAttemptingTxn(false);
          // we only care if the error is something _other_ than the user rejected the tx
          if (error?.code !== 4001) {
            console.error(error);
          }
        });
    }
  }

  async function onAdd() {
    if (!chainId || !library || !account) return;

    if (!positionManager || !baseCurrency || !quoteCurrency) {
      return;
    }

    if (position && account && deadline && liquidityToAdd && parsedAmounts.CURRENCY_A && parsedAmounts.CURRENCY_B) {
      // const useNative = baseCurrency.isNative ? baseCurrency : quoteCurrency.isNative ? quoteCurrency : undefined;
      const supplyParams = {
        token1: position.pool.token0.address,
        token0: position.pool.token1.address,
        fee: position.pool.DesireSwapFee.toString(),
        lowestRangeIndex: (position.tickLower / 10).toString(), // TODO "/10" zamienic na /10TICK_SPACING[fee]
        highestRangeIndex: (position.tickUpper / 10 - 1).toString(), // '-1' jest wazne
        liqToAdd: liquidityToAdd.toString(),
        amount0Max: JSBI.divide(
          JSBI.multiply(parsedAmounts.CURRENCY_A.quotient, JSBI.BigInt(201)),
          JSBI.BigInt(100)
        ).toString(),
        amount1Max: JSBI.divide(
          JSBI.multiply(parsedAmounts.CURRENCY_B.quotient, JSBI.BigInt(201)),
          JSBI.BigInt(100)
        ).toString(),
        recipient: account,
        deadline: deadline.toString(),
      };
      const calldata = new Interface(LiquidityManagerABI).encodeFunctionData('supply', [supplyParams]);

      const txn: { to: string; data: string; value: string; gasLimit?: BigNumber } = {
        to: DESIRE_SWAP_V0_LIQUIDITY_MANAGER_ADDRESS[chainId],
        data: calldata,
        value: toHex(0),
      };

      // if (argentWalletContract) {
      //   const amountA = parsedAmounts[Field.CURRENCY_A];
      //   const amountB = parsedAmounts[Field.CURRENCY_B];
      //   const batch = [
      //     ...(amountA && amountA.currency.isToken
      //       ? [approveAmountCalldata(amountA, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId])]
      //       : []),
      //     ...(amountB && amountB.currency.isToken
      //       ? [approveAmountCalldata(amountB, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId])]
      //       : []),
      //     {
      //       to: txn.to,
      //       data: txn.data,
      //       value: txn.value,
      //     },
      //   ];
      //   const data = argentWalletContract.interface.encodeFunctionData('wc_multiCall', [batch]);
      //   txn = {\
      //     to: argentWalletContract.address,
      //     data,
      //     value: '0x0',
      //   };
      // }

      setAttemptingTxn(true);

      // library
      //   .getSigner()
      //   .estimateGas(txn)
      //   // .then((estimate) => {
      //   .then(() => {
      const newTxn = {
        ...txn,
        gasLimit: BigNumber.from(10).pow(7), //TODO gaslimit //calculateGasMargin(chainId, estimate),
      };

      return library
        .getSigner()
        .sendTransaction(newTxn)
        .then((response: TransactionResponse) => {
          setAttemptingTxn(false);
          addTransaction(response, {
            summary: noLiquidity
              ? t`Create pool and add ${baseCurrency?.symbol}/${quoteCurrency?.symbol} V3 liquidity`
              : t`Add ${baseCurrency?.symbol}/${quoteCurrency?.symbol} V3 liquidity`,
          });
          setTxHash(response.hash);
          // ReactGA.event({
          //   category: 'Liquidity',
          //   action: 'Add',
          //   label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join('/'),
          // });
        })
        .catch((error) => {
          console.error('Failed to send transaction', error);
          setAttemptingTxn(false);
          // we only care if the error is something _other_ than the user rejected the tx
          if (error?.code !== 4001) {
            console.error(error);
          }
        });
      // })
    }
  }

  const handleCurrencySelect = useCallback(
    (currencyNew: Currency, currencyIdOther?: string): (string | undefined)[] => {
      const currencyIdNew = currencyId(currencyNew);

      if (currencyIdNew === currencyIdOther) {
        // not ideal, but for now clobber the other if the currency ids are equal
        return [currencyIdNew, undefined];
      }
      // prevent weth + eth
      const isETHOrWETHNew =
        currencyIdNew === 'ETH' || (chainId !== undefined && currencyIdNew === WETH9_EXTENDED[chainId]?.address);
      const isETHOrWETHOther =
        currencyIdOther !== undefined &&
        (currencyIdOther === 'ETH' || (chainId !== undefined && currencyIdOther === WETH9_EXTENDED[chainId]?.address));

      if (isETHOrWETHNew && isETHOrWETHOther) {
        return [currencyIdNew, undefined];
      }
      return [currencyIdNew, currencyIdOther];
    },
    [chainId]
  );

  const handleCurrencyASelect = useCallback(
    (currencyANew: Currency) => {
      const [idA, idB] = handleCurrencySelect(currencyANew, currencyIdB);
      if (idB === undefined) {
        history.push(`/add/${idA}`);
      } else {
        history.push(`/add/${idA}/${idB}`);
      }
    },
    [handleCurrencySelect, currencyIdB, history]
  );

  const handleCurrencyBSelect = useCallback(
    (currencyBNew: Currency) => {
      const [idB, idA] = handleCurrencySelect(currencyBNew, currencyIdA);
      if (idA === undefined) {
        history.push(`/add/${idB}`);
      } else {
        history.push(`/add/${idA}/${idB}`);
      }
    },
    [handleCurrencySelect, currencyIdA, history]
  );

  const handleFeePoolSelect = useCallback(
    (newFeeAmount: FeeAmount) => {
      onLeftRangeInput('');
      onRightRangeInput('');
      history.push(`/add/${currencyIdA}/${currencyIdB}/${newFeeAmount}`);
    },
    [currencyIdA, currencyIdB, history, onLeftRangeInput, onRightRangeInput]
  );

  // flag for whether pool creation must be a separate tx
  const mustCreateSeparately =
    noLiquidity && (chainId === SupportedChainId.OPTIMISM || chainId === SupportedChainId.OPTIMISTIC_KOVAN);

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false);
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('');
      // dont jump to pool page if creating
      if (!mustCreateSeparately) {
        history.push('/pool');
      }
    }
    setTxHash('');
  }, [history, mustCreateSeparately, onFieldAInput, txHash]);

  const addIsUnsupported = useIsSwapUnsupported(currencies?.CURRENCY_A, currencies?.CURRENCY_B);

  const clearAll = useCallback(() => {
    onFieldAInput('');
    onFieldBInput('');
    onLeftRangeInput('');
    onRightRangeInput('');
    history.push(`/add`);
  }, [history, onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput]);

  // get value and prices at ticks
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks;
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = pricesAtTicks;

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper, getSetFullRange } =
    useRangeHopCallbacks(baseCurrency ?? undefined, quoteCurrency ?? undefined, feeAmount, tickLower, tickUpper, pool);

  // we need an existence check on parsed amounts for single-asset deposits
  const showApprovalA =
    !argentWalletContract && approvalA !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_A];
  const showApprovalB =
    !argentWalletContract && approvalB !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_B];

  const pendingText = mustCreateSeparately
    ? `Creating ${currencies[Field.CURRENCY_A]?.symbol}/${currencies[Field.CURRENCY_B]?.symbol} ${
        feeAmount ? feeAmount / 10000 : ''
      }% Pool`
    : `Supplying ${!depositADisabled ? parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) : ''} ${
        !depositADisabled ? currencies[Field.CURRENCY_A]?.symbol : ''
      } ${!outOfRange ? 'and' : ''} ${!depositBDisabled ? parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) : ''} ${
        !depositBDisabled ? currencies[Field.CURRENCY_B]?.symbol : ''
      }`;

  const Buttons = () =>
    addIsUnsupported ? (
      <ButtonPrimary disabled $borderRadius="12px" padding={'12px'}>
        <TYPE.main mb="4px">
          <Trans>Unsupported Asset</Trans>
        </TYPE.main>
      </ButtonPrimary>
    ) : !account ? (
      <ButtonLight onClick={toggleWalletModal} $borderRadius="12px" padding={'12px'}>
        <Trans>Connect wallet</Trans>
      </ButtonLight>
    ) : (
      <AutoColumn gap={'md'}>
        {(approvalA === ApprovalState.NOT_APPROVED ||
          approvalA === ApprovalState.PENDING ||
          approvalB === ApprovalState.NOT_APPROVED ||
          approvalB === ApprovalState.PENDING) &&
          isValid && (
            <RowBetween>
              {showApprovalA && (
                <ButtonPrimary
                  onClick={approveACallback}
                  disabled={approvalA === ApprovalState.PENDING}
                  width={showApprovalB ? '48%' : '100%'}
                >
                  {approvalA === ApprovalState.PENDING ? (
                    <Dots>
                      <Trans>Approving {currencies[Field.CURRENCY_A]?.symbol}</Trans>
                    </Dots>
                  ) : (
                    <Trans>Approve {currencies[Field.CURRENCY_A]?.symbol}</Trans>
                  )}
                </ButtonPrimary>
              )}
              {showApprovalB && (
                <ButtonPrimary
                  onClick={approveBCallback}
                  disabled={approvalB === ApprovalState.PENDING}
                  width={showApprovalA ? '48%' : '100%'}
                >
                  {approvalB === ApprovalState.PENDING ? (
                    <Dots>
                      <Trans>Approving {currencies[Field.CURRENCY_B]?.symbol}</Trans>
                    </Dots>
                  ) : (
                    <Trans>Approve {currencies[Field.CURRENCY_B]?.symbol}</Trans>
                  )}
                </ButtonPrimary>
              )}
            </RowBetween>
          )}
        {mustCreateSeparately && (
          <ButtonError onClick={onCreate} disabled={!isValid || attemptingTxn || !position}>
            {attemptingTxn ? (
              <Dots>
                <Trans>Confirm Create</Trans>
              </Dots>
            ) : (
              <Text fontWeight={500}>{errorMessage || <Trans>Create</Trans>}</Text>
            )}
          </ButtonError>
        )}
        <ButtonError
          onClick={() => {
            expertMode ? onAdd() : setShowConfirm(true);
          }}
          disabled={
            mustCreateSeparately ||
            !isValid ||
            (!argentWalletContract && approvalA !== ApprovalState.APPROVED && !depositADisabled) ||
            (!argentWalletContract && approvalB !== ApprovalState.APPROVED && !depositBDisabled)
          }
          error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
        >
          <Text fontWeight={500}>
            {mustCreateSeparately ? <Trans>Add</Trans> : errorMessage || <Trans>Preview</Trans>}
          </Text>
        </ButtonError>
      </AutoColumn>
    );

  return (
    <>
      <ScrollablePage>
        <AddLiquidityNetworkAlert />
        <OptimismDowntimeWarning />
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={txHash}
          content={() => (
            <ConfirmationModalContent
              title={t`Add Liquidity`}
              onDismiss={handleDismissConfirmation}
              topContent={() => (
                <Review
                  parsedAmounts={parsedAmounts}
                  position={position}
                  existingPosition={existingPosition}
                  priceLower={priceLower}
                  priceUpper={priceUpper}
                  outOfRange={outOfRange}
                  ticksAtLimit={ticksAtLimit}
                />
              )}
              bottomContent={() => (
                <ButtonPrimary style={{ marginTop: '1rem' }} onClick={onAdd}>
                  <Text fontWeight={500} fontSize={20}>
                    <Trans>Add</Trans>
                  </Text>
                </ButtonPrimary>
              )}
            />
          )}
          pendingText={pendingText}
        />
        <PageWrapper wide={!hasExistingPosition}>
          <AddRemoveTabs
            creating={false}
            adding
            positionID={tokenId}
            defaultSlippage={DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE}
            showBackLink={!hasExistingPosition}
          >
            {!hasExistingPosition && (
              <Row justifyContent="flex-end" style={{ width: 'fit-content', minWidth: 'fit-content' }}>
                <MediumOnly>
                  <ButtonText onClick={clearAll} margin="0 15px 0 0">
                    <TYPE.blue fontSize="12px">
                      <Trans>Clear All</Trans>
                    </TYPE.blue>
                  </ButtonText>
                </MediumOnly>
                {baseCurrency && quoteCurrency ? (
                  <RateToggle
                    currencyA={baseCurrency}
                    currencyB={quoteCurrency}
                    handleRateToggle={() => {
                      if (!ticksAtLimit[Bound.LOWER] && !ticksAtLimit[Bound.UPPER]) {
                        onLeftRangeInput((invertPrice ? priceLower : priceUpper?.invert())?.toSignificant(6) ?? '');
                        onRightRangeInput((invertPrice ? priceUpper : priceLower?.invert())?.toSignificant(6) ?? '');
                        onFieldAInput(formattedAmounts[Field.CURRENCY_B] ?? '');
                      }
                      history.push(
                        `/add/${currencyIdB as string}/${currencyIdA as string}${feeAmount ? `/${feeAmount}` : ''}`
                      );
                    }}
                  />
                ) : null}
              </Row>
            )}
          </AddRemoveTabs>
          <Wrapper>
            <ResponsiveTwoColumns wide={!hasExistingPosition}>
              <AutoColumn gap="lg">
                {!hasExistingPosition && (
                  <>
                    <AutoColumn gap="md">
                      <RowBetween paddingBottom="20px">
                        <TYPE.label>
                          <Trans>Select Pair</Trans>
                        </TYPE.label>
                      </RowBetween>
                      <RowBetween>
                        <CurrencyDropdown
                          value={formattedAmounts[Field.CURRENCY_A]}
                          onUserInput={onFieldAInput}
                          hideInput
                          onMax={() => {
                            onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '');
                          }}
                          onCurrencySelect={handleCurrencyASelect}
                          showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                          currency={currencies[Field.CURRENCY_A]}
                          id="add-liquidity-input-tokena"
                          showCommonBases
                        />
                        <div style={{ width: '12px' }} />

                        <CurrencyDropdown
                          value={formattedAmounts[Field.CURRENCY_B]}
                          hideInput
                          onUserInput={onFieldBInput}
                          onCurrencySelect={handleCurrencyBSelect}
                          onMax={() => {
                            onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '');
                          }}
                          showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                          currency={currencies[Field.CURRENCY_B]}
                          id="add-liquidity-input-tokenb"
                          showCommonBases
                        />
                      </RowBetween>

                      <FeeSelector
                        disabled={!quoteCurrency || !baseCurrency}
                        feeAmount={feeAmount}
                        handleFeePoolSelect={handleFeePoolSelect}
                        currencyA={baseCurrency ?? undefined}
                        currencyB={quoteCurrency ?? undefined}
                      />
                    </AutoColumn>{' '}
                  </>
                )}
                {hasExistingPosition && existingPosition && (
                  <PositionPreview
                    position={existingPosition}
                    title={<Trans>Selected Range</Trans>}
                    inRange={!outOfRange}
                    ticksAtLimit={ticksAtLimit}
                  />
                )}
              </AutoColumn>
              <div>
                <DynamicSection
                  disabled={tickLower === undefined || tickUpper === undefined || invalidPool || invalidRange}
                >
                  <AutoColumn gap="md">
                    <TYPE.label>
                      {hasExistingPosition ? <Trans>Add more liquidity</Trans> : <Trans>Deposit Amounts</Trans>}
                    </TYPE.label>

                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_A]}
                      onUserInput={onFieldAInput}
                      onMax={() => {
                        onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '');
                      }}
                      showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                      currency={currencies[Field.CURRENCY_A]}
                      id="add-liquidity-input-tokena"
                      fiatValue={usdcValues[Field.CURRENCY_A]}
                      showCommonBases
                      locked={depositADisabled}
                    />

                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_B]}
                      onUserInput={onFieldBInput}
                      onMax={() => {
                        onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '');
                      }}
                      showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                      fiatValue={usdcValues[Field.CURRENCY_B]}
                      currency={currencies[Field.CURRENCY_B]}
                      id="add-liquidity-input-tokenb"
                      showCommonBases
                      locked={depositBDisabled}
                    />
                  </AutoColumn>
                </DynamicSection>
              </div>

              {!hasExistingPosition ? (
                <>
                  <HideMedium>
                    <Buttons />
                  </HideMedium>
                  <RightContainer gap="lg">
                    <DynamicSection gap="md" disabled={!feeAmount || invalidPool}>
                      {!noLiquidity ? (
                        <>
                          <RowBetween>
                            <TYPE.label>
                              <Trans>Set Price Range</Trans>
                            </TYPE.label>
                          </RowBetween>

                          {price && baseCurrency && quoteCurrency && !noLiquidity && (
                            <AutoRow gap="4px" justify="center" style={{ marginTop: '0.5rem' }}>
                              <Trans>
                                <TYPE.main fontWeight={500} textAlign="center" fontSize={12} color="text1">
                                  Current Price:
                                </TYPE.main>
                                <TYPE.body fontWeight={500} textAlign="center" fontSize={12} color="text1">
                                  <HoverInlineText
                                    maxCharacters={20}
                                    text={invertPrice ? price.invert().toSignificant(6) : price.toSignificant(6)}
                                  />
                                </TYPE.body>
                                <TYPE.body color="text2" fontSize={12}>
                                  {quoteCurrency?.symbol} per {baseCurrency.symbol}
                                </TYPE.body>
                              </Trans>
                            </AutoRow>
                          )}

                          <LiquidityChartRangeInput
                            currencyA={baseCurrency ?? undefined}
                            currencyB={quoteCurrency ?? undefined}
                            feeAmount={feeAmount}
                            ticksAtLimit={ticksAtLimit}
                            price={
                              price ? parseFloat((invertPrice ? price.invert() : price).toSignificant(8)) : undefined
                            }
                            priceLower={priceLower}
                            priceUpper={priceUpper}
                            onLeftRangeInput={onLeftRangeInput}
                            onRightRangeInput={onRightRangeInput}
                            interactive={!hasExistingPosition}
                          />
                        </>
                      ) : (
                        <AutoColumn gap="md">
                          <RowBetween>
                            <TYPE.label>
                              <Trans>Set Starting Price</Trans>
                            </TYPE.label>
                          </RowBetween>
                          {noLiquidity && (
                            <BlueCard
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: '1rem 1rem',
                              }}
                            >
                              <TYPE.body
                                fontSize={14}
                                style={{ fontWeight: 500 }}
                                textAlign="left"
                                color={theme.primaryText1}
                              >
                                {mustCreateSeparately ? (
                                  <Trans>
                                    {`This pool must be initialized on ${
                                      chainId && CHAIN_INFO ? CHAIN_INFO[chainId].label : ''
                                    } before you can add liquidity. To initialize, select a starting price for the pool. Then, enter your liquidity price range and deposit amount.`}
                                  </Trans>
                                ) : (
                                  <Trans>
                                    This pool must be initialized before you can add liquidity. To initialize, select a
                                    starting price for the pool. Then, enter your liquidity price range and deposit
                                    amount. Gas fees will be higher than usual due to the initialization transaction.
                                  </Trans>
                                )}
                              </TYPE.body>
                            </BlueCard>
                          )}
                          <OutlineCard padding="12px">
                            <StyledInput
                              className="start-price-input"
                              value={startPriceTypedValue}
                              onUserInput={onStartPriceInput}
                            />
                          </OutlineCard>
                          <RowBetween style={{ backgroundColor: theme.bg1, padding: '12px', borderRadius: '12px' }}>
                            <TYPE.main>
                              <Trans>Current {baseCurrency?.symbol} Price:</Trans>
                            </TYPE.main>
                            <TYPE.main>
                              {price ? (
                                <TYPE.main>
                                  <RowFixed>
                                    <HoverInlineText
                                      maxCharacters={20}
                                      text={invertPrice ? price?.invert()?.toSignificant(5) : price?.toSignificant(5)}
                                    />{' '}
                                    <span style={{ marginLeft: '4px' }}>{quoteCurrency?.symbol}</span>
                                  </RowFixed>
                                </TYPE.main>
                              ) : (
                                '-'
                              )}
                            </TYPE.main>
                          </RowBetween>
                        </AutoColumn>
                      )}
                    </DynamicSection>

                    <DynamicSection
                      gap="md"
                      disabled={!feeAmount || invalidPool || (noLiquidity && !startPriceTypedValue)}
                    >
                      <StackedContainer>
                        <StackedItem style={{ opacity: showCapitalEfficiencyWarning ? '0.05' : 1 }}>
                          <AutoColumn gap="md">
                            {noLiquidity && (
                              <RowBetween>
                                <TYPE.label>
                                  <Trans>Set Price Range</Trans>
                                </TYPE.label>
                              </RowBetween>
                            )}
                            <RangeSelector
                              priceLower={priceLower}
                              priceUpper={priceUpper}
                              getDecrementLower={getDecrementLower}
                              getIncrementLower={getIncrementLower}
                              getDecrementUpper={getDecrementUpper}
                              getIncrementUpper={getIncrementUpper}
                              onLeftRangeInput={onLeftRangeInput}
                              onRightRangeInput={onRightRangeInput}
                              currencyA={baseCurrency}
                              currencyB={quoteCurrency}
                              feeAmount={feeAmount}
                              ticksAtLimit={ticksAtLimit}
                            />
                            {!noLiquidity && (
                              <PresetsButtons
                                setFullRange={() => {
                                  setShowCapitalEfficiencyWarning(true);
                                }}
                              />
                            )}
                          </AutoColumn>
                        </StackedItem>

                        {showCapitalEfficiencyWarning && (
                          <StackedItem zIndex={1}>
                            <YellowCard
                              padding="15px"
                              $borderRadius="12px"
                              height="100%"
                              style={{
                                borderColor: theme.yellow3,
                                border: '1px solid',
                              }}
                            >
                              <AutoColumn gap="8px" style={{ height: '100%' }}>
                                <RowFixed>
                                  <AlertTriangle stroke={theme.yellow3} size="16px" />
                                  <TYPE.yellow ml="12px" fontSize="15px">
                                    <Trans>Efficiency Comparison</Trans>
                                  </TYPE.yellow>
                                </RowFixed>
                                <RowFixed>
                                  <TYPE.yellow ml="12px" fontSize="13px" margin={0} fontWeight={400}>
                                    <Trans>
                                      Full range positions may earn less fees than concentrated positions. Learn more{' '}
                                      <ExternalLink
                                        style={{ color: theme.yellow3, textDecoration: 'underline' }}
                                        href={
                                          'https://help.uniswap.org/en/articles/5434296-can-i-provide-liquidity-over-the-full-range-in-v3'
                                        }
                                      >
                                        here
                                      </ExternalLink>
                                      .
                                    </Trans>
                                  </TYPE.yellow>
                                </RowFixed>
                                <Row>
                                  <ButtonYellow
                                    padding="8px"
                                    marginRight="8px"
                                    $borderRadius="8px"
                                    width="auto"
                                    onClick={() => {
                                      setShowCapitalEfficiencyWarning(false);
                                      getSetFullRange();
                                    }}
                                  >
                                    <TYPE.black fontSize={13} color="black">
                                      <Trans>I Understand</Trans>
                                    </TYPE.black>
                                  </ButtonYellow>
                                </Row>
                              </AutoColumn>
                            </YellowCard>
                          </StackedItem>
                        )}
                      </StackedContainer>

                      {outOfRange ? (
                        <YellowCard padding="8px 12px" $borderRadius="12px">
                          <RowBetween>
                            <AlertTriangle stroke={theme.yellow3} size="16px" />
                            <TYPE.yellow ml="12px" fontSize="12px">
                              <Trans>
                                Your position will not earn fees or be used in trades until the market price moves into
                                your range.
                              </Trans>
                            </TYPE.yellow>
                          </RowBetween>
                        </YellowCard>
                      ) : null}

                      {invalidRange ? (
                        <YellowCard padding="8px 12px" $borderRadius="12px">
                          <RowBetween>
                            <AlertTriangle stroke={theme.yellow3} size="16px" />
                            <TYPE.yellow ml="12px" fontSize="12px">
                              <Trans>Invalid range selected. The min price must be lower than the max price.</Trans>
                            </TYPE.yellow>
                          </RowBetween>
                        </YellowCard>
                      ) : null}
                    </DynamicSection>

                    <MediumOnly>
                      <Buttons />
                    </MediumOnly>
                  </RightContainer>
                </>
              ) : (
                <Buttons />
              )}
            </ResponsiveTwoColumns>
          </Wrapper>
        </PageWrapper>
        {addIsUnsupported && (
          <UnsupportedCurrencyFooter
            show={addIsUnsupported}
            currencies={[currencies.CURRENCY_A, currencies.CURRENCY_B]}
          />
        )}
      </ScrollablePage>
      <SwitchLocaleLink />
    </>
  );
}
