import { Trans } from '@lingui/macro';
import { Currency, TradeType } from 'sdkCore/index';
import { Trade as V2Trade } from '../../v2sdk/entities/trade';
import { Trade as V3Trade } from 'v3sdk/index';

import { ReactNode } from 'react';
import { Text } from 'rebass';
import { ButtonError } from '../Button';
import { AutoRow } from '../Row';
import { SwapCallbackError } from './styleds';

export default function SwapModalFooter({
  onConfirm,
  swapErrorMessage,
  disabledConfirm,
}: {
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>;
  onConfirm: () => void;
  swapErrorMessage: ReactNode | undefined;
  disabledConfirm: boolean;
}) {
  return (
    <>
      <AutoRow>
        <ButtonError
          onClick={onConfirm}
          disabled={disabledConfirm}
          style={{ margin: '10px 0 0 0' }}
          id="confirm-swap-or-send"
        >
          <Text fontSize={20} fontWeight={500}>
            <Trans>Confirm Swap</Trans>
          </Text>
        </ButtonError>

        {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </AutoRow>
    </>
  );
}
