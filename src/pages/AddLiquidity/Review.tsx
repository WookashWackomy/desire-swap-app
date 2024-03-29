import { Bound, Field } from '../../state/mint/v3/actions';
import { AutoColumn } from 'components/Column';
import styled from 'styled-components/macro';
import { Currency, CurrencyAmount, Price } from 'sdkCore/index';
import { Position } from 'v3sdk/index';
import { PositionPreview } from 'components/PositionPreview';

const Wrapper = styled.div`
  padding-top: 12px;
`;

export function Review({
  position,
  outOfRange,
  ticksAtLimit,
}: {
  position?: Position;
  existingPosition?: Position;
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> };
  priceLower?: Price<Currency, Currency>;
  priceUpper?: Price<Currency, Currency>;
  outOfRange: boolean;
  ticksAtLimit: { [bound in Bound]?: boolean | undefined };
}) {
  return (
    <Wrapper>
      <AutoColumn gap="lg">
        {position ? (
          <PositionPreview
            position={position}
            inRange={!outOfRange}
            ticksAtLimit={ticksAtLimit}
            title={'Selected Range'}
          />
        ) : null}
      </AutoColumn>
    </Wrapper>
  );
}
