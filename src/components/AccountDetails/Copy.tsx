import React from 'react';
import styled from 'styled-components/macro';
import { CheckCircle, Copy } from 'react-feather';
import { Trans } from '@lingui/macro';

import useCopyClipboard from 'hooks/useCopyClipboard';
import { LinkStyledButton } from '../../theme';

const CopyIcon = styled(LinkStyledButton)`
  color: ${({ theme }) => theme.text3};
  flex-shrink: 0;
  display: flex;
  text-decoration: none;
  font-size: 0.825rem;
  :hover,
  :active,
  :focus {
    text-decoration: none;
    color: ${({ theme }) => theme.text2};
  }
`;
const TransactionStatusText = styled.span`
  margin-left: 0.25rem;
  font-size: 0.825rem;
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
`;

interface CopyProps {
  toCopy: string;
  children?: React.ReactNode;
}

const CopyHelper: React.FC<CopyProps> = ({ toCopy, children }) => {
  const [isCopied, setCopied] = useCopyClipboard();

  return (
    <CopyIcon onClick={() => setCopied(toCopy)}>
      {isCopied ? (
        <TransactionStatusText>
          <CheckCircle size={'16'} />
          <TransactionStatusText>
            <Trans>Copied</Trans>
          </TransactionStatusText>
        </TransactionStatusText>
      ) : (
        <TransactionStatusText>
          <Copy size={'16'} />
        </TransactionStatusText>
      )}
      {isCopied ? '' : children}
    </CopyIcon>
  );
};

export default CopyHelper;
