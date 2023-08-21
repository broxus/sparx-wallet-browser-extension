import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { useIntl } from 'react-intl'

import { Button, Container, Content, Footer, PageLoader, ParamsPanel, Space, useEnterPassword, usePasswordCache, UserInfo, useViewModel } from '@app/popup/modules/shared'
import { LedgerConnector } from '@app/popup/modules/ledger'

import { DisplayTypeSelector } from '../DisplayTypeSelector'
import { ApprovalNetwork } from '../ApprovalNetwork'
import { ApproveSignDataViewModel } from './ApproveSignDataViewModel'
import styles from './ApproveSignData.module.scss'

export const ApproveSignData = observer((): JSX.Element | null => {
    const vm = useViewModel(ApproveSignDataViewModel)
    const intl = useIntl()
    const passwordCached = usePasswordCache(vm.approval.requestData.publicKey)
    const enterPassword = useEnterPassword({
        keyEntry: vm.keyEntry,
        error: vm.error,
        loading: vm.loading, // || (vm.submitted && !vm.error),
        onSubmit: vm.onSubmit,
    })

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
                <h2>{intl.formatMessage({ id: 'APPROVE_SIGN_DATA_APPROVAL_TITLE' })}</h2>

                <ParamsPanel className={styles.panel}>
                    <ParamsPanel.Param>
                        <UserInfo account={vm.account} />
                    </ParamsPanel.Param>
                    <ParamsPanel.Param label={intl.formatMessage({ id: 'APPROVE_ORIGIN_TITLE' })}>
                        {vm.approval.origin}
                    </ParamsPanel.Param>

                    <ParamsPanel.Param
                        label={(
                            <div className={styles.label}>
                                {intl.formatMessage({ id: 'APPROVE_SIGN_DATA_TERM_DATA' })}
                                <DisplayTypeSelector value={vm.displayType} onChange={vm.setDisplayType} />
                            </div>
                        )}
                    >
                        {vm.data}
                    </ParamsPanel.Param>
                </ParamsPanel>
            </Content>

            <Footer>
                <Space direction="row" gap="s">
                    <Button design="secondary" disabled={vm.loading} onClick={vm.onReject}>
                        {intl.formatMessage({ id: 'REJECT_BTN_TEXT' })}
                    </Button>
                    <Button
                        disabled={vm.loading || passwordCached == null}
                        onClick={() => (passwordCached ? vm.onSubmit() : enterPassword.show())}
                    >
                        {intl.formatMessage({ id: 'SIGN_BTN_TEXT' })}
                    </Button>
                </Space>
            </Footer>
        </Container>
    )
})
