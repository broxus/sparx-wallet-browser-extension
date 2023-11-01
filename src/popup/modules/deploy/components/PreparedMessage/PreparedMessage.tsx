import type * as nt from '@broxus/ever-wallet-wasm'
import { memo } from 'react'
import { useIntl } from 'react-intl'

import { convertEvers } from '@app/shared'
import { AmountWithFees, AssetIcon, Button, Container, Content, Footer, Header, Navbar, ParamsPanel, PasswordForm, Space, usePasswordForm } from '@app/popup/modules/shared'

import styles from './PreparedMessage.module.scss'

interface Props {
    keyEntry: nt.KeyStoreEntry;
    currencyName: string;
    balance?: string;
    custodians?: string[];
    fees?: string;
    error?: string;
    loading?: boolean;
    onSubmit(password?: string, cache?: boolean): void;
    onBack(): void;
}

export const PreparedMessage = memo((props: Props): JSX.Element => {
    const {
        keyEntry,
        balance,
        custodians,
        loading,
        error,
        fees,
        currencyName,
        onSubmit,
        onBack,
    } = props

    const intl = useIntl()
    const { form, isValid, handleSubmit } = usePasswordForm(keyEntry)

    return (
        <Container>
            <Header>
                <Navbar back={onBack}>
                    {intl.formatMessage({ id: 'DEPLOY_WALLET_HEADER' })}
                </Navbar>
            </Header>

            <Content>
                <ParamsPanel>
                    <ParamsPanel.Param
                        label={(
                            <span className={styles.hint}>
                                {intl.formatMessage({ id: 'DEPLOY_MULTISIG_PANEL_COMMENT' })}
                            </span>
                        )}
                    />

                    <ParamsPanel.Param bold label={intl.formatMessage({ id: 'DEPLOY_WALLET_DETAILS_TERM_BALANCE' })}>
                        <AmountWithFees
                            icon={<AssetIcon type="ever_wallet" />}
                            value={convertEvers(balance)}
                            currency={currencyName}
                            fees={fees}
                        />
                    </ParamsPanel.Param>

                    {custodians?.map((custodian, i) => (
                        <ParamsPanel.Param
                            key={custodian}
                            label={intl.formatMessage(
                                { id: 'DEPLOY_MULTISIG_DETAILS_TERM_CUSTODIAN' },
                                { index: i + 1 },
                            )}
                        >
                            {custodian}
                        </ParamsPanel.Param>
                    ))}
                </ParamsPanel>
            </Content>

            <Footer background>
                <Space direction="column" gap="m">
                    <PasswordForm
                        form={form}
                        error={error}
                        keyEntry={keyEntry}
                        onSubmit={handleSubmit(onSubmit)}
                    />

                    <Button disabled={!fees || !isValid} loading={loading} onClick={handleSubmit(onSubmit)}>
                        {intl.formatMessage({ id: 'DEPLOY_BTN_TEXT' })}
                    </Button>
                </Space>
            </Footer>
        </Container>
    )
})
