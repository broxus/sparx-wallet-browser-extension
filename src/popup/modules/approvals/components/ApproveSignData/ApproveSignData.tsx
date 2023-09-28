import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { useIntl } from 'react-intl'

import { Button, Container, Content, Footer, PageLoader, ParamsPanel, PasswordForm, PasswordFormRef, Space, UserInfo, useViewModel } from '@app/popup/modules/shared'
import { LedgerConnector } from '@app/popup/modules/ledger'

import { DisplayTypeSelector } from '../DisplayTypeSelector'
import { ApprovalNetwork } from '../ApprovalNetwork'
import { WebsiteIcon } from '../WebsiteIcon'
import { ApproveSignDataViewModel } from './ApproveSignDataViewModel'
import styles from './ApproveSignData.module.scss'

export const ApproveSignData = observer((): JSX.Element | null => {
    const vm = useViewModel(ApproveSignDataViewModel)
    const intl = useIntl()
    const ref = useRef<PasswordFormRef>(null)

    useEffect(() => {
        if (!vm.account && !vm.loading) {
            vm.onReject()
        }
    }, [!!vm.account, vm.loading])

    if (!vm.account) return <PageLoader />

    if (vm.ledgerConnect) {
        return (
            <LedgerConnector
                onNext={vm.handleLedgerConnected}
                onBack={vm.handleLedgerFailed}
            />
        )
    }

    return (
        <Container>
            {vm.ledger.loading && <PageLoader />}

            <Content>
                <ApprovalNetwork />
                <Space direction="column" gap="l">
                    <h2>{intl.formatMessage({ id: 'APPROVE_SIGN_DATA_APPROVAL_TITLE' })}</h2>

                    <PasswordForm
                        ref={ref}
                        error={vm.error}
                        keyEntry={vm.keyEntry}
                        onSubmit={vm.onSubmit}
                    />

                    <ParamsPanel>
                        <ParamsPanel.Param>
                            <UserInfo account={vm.account} />
                        </ParamsPanel.Param>
                        <ParamsPanel.Param label={intl.formatMessage({ id: 'APPROVE_ORIGIN_TITLE' })}>
                            <WebsiteIcon origin={vm.approval.origin} />
                        </ParamsPanel.Param>

                        <ParamsPanel.Param
                            label={(
                                <div className={styles.label}>
                                    {intl.formatMessage({ id: 'APPROVE_SIGN_DATA_TERM_DATA' })}
                                    <DisplayTypeSelector value={vm.displayType} onChange={vm.setDisplayType} />
                                </div>
                            )}
                        >
                            <div className={styles.code}>
                                {vm.data}
                            </div>
                        </ParamsPanel.Param>
                    </ParamsPanel>
                </Space>
            </Content>

            <Footer>
                <Space direction="row" gap="s">
                    <Button design="secondary" disabled={vm.loading} onClick={vm.onReject}>
                        {intl.formatMessage({ id: 'REJECT_BTN_TEXT' })}
                    </Button>
                    <Button loading={vm.loading} onClick={() => ref.current?.submit()}>
                        {intl.formatMessage({ id: 'SIGN_BTN_TEXT' })}
                    </Button>
                </Space>
            </Footer>
        </Container>
    )
})
