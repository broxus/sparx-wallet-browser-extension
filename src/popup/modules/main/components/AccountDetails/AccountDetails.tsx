import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'
import classNames from 'classnames'
import { useCallback } from 'react'

import { Icons } from '@app/popup/icons'
import { IconButton, useConfirmation, useViewModel } from '@app/popup/modules/shared'
import { Networks } from '@app/popup/modules/network'
import { ChangeAccountName } from '@app/popup/modules/account'
import { LedgerVerifyAddress } from '@app/popup/modules/ledger'

import { Receive } from '../Receive'
import { ChangeAccount } from '../ChangeAccount'
import { AccountPreference } from '../AccountPreference'
import { CreateAccountPanel } from '../CreateAccountPanel'
import { AccountCard, Carousel } from './components'
import { AccountDetailsViewModel } from './AccountDetailsViewModel'
import styles from './AccountDetails.module.scss'

export const AccountDetails = observer((): JSX.Element => {
    const vm = useViewModel(AccountDetailsViewModel)
    const confirmation = useConfirmation()
    const intl = useIntl()

    const handleChange = useCallback(() => vm.panel.open({
        whiteBg: true,
        render: () => <ChangeAccount />,
    }), [])
    const handleReceive = useCallback(() => vm.panel.open({
        render: () => <Receive address={vm.selectedAccountAddress!} />,
    }), [])
    const handleRename = useCallback(() => vm.panel.open({
        render: () => <ChangeAccountName account={vm.selectedAccount!} />,
    }), [])
    const handlePreference = useCallback(() => vm.panel.open({
        render: () => <AccountPreference address={vm.selectedAccountAddress!} onRemove={vm.removeAccount} />,
    }), [])
    const handleVerify = useCallback(() => vm.panel.open({
        render: () => <LedgerVerifyAddress address={vm.selectedAccountAddress!} />,
    }), [])
    const handleAddAccount = useCallback(() => vm.panel.open({
        whiteBg: true,
        render: () => <CreateAccountPanel />,
    }), [])
    const handleHide = useCallback(async () => {
        const address = vm.selectedAccountAddress!
        const confirmed = await confirmation.show({
            title: intl.formatMessage({ id: 'HIDE_ACCOUNT_CONFIRMATION_TITLE' }),
            body: intl.formatMessage({ id: 'HIDE_ACCOUNT_CONFIRMATION_TEXT' }),
            confirmBtnText: intl.formatMessage({ id: 'HIDE_ACCOUNT_CONFIRMATION_BTN_TEXT' }),
        })

        if (confirmed) {
            await vm.hideAccount(address)
        }
    }, [])

    return (
        <div className={styles.details}>
            <div className={styles.top}>
                <Networks onSettings={vm.openNetworkSettings} />
                <IconButton
                    size="s"
                    design="secondary"
                    className={styles.settings}
                    icon={Icons.person}
                    onClick={vm.onSettings}
                />
            </div>

            <Carousel
                current={vm.carouselIndex}
                onAddAccount={handleAddAccount}
                onChangeAccount={handleChange}
                onChange={vm.onSlide}
            >
                {vm.accounts.map(({ tonWallet }) => (
                    <AccountCard
                        key={tonWallet.address}
                        address={tonWallet.address}
                        onRename={handleRename}
                        onPreference={handlePreference}
                        onVerify={handleVerify}
                        onOpenInExplorer={vm.openAccountInExplorer}
                        onHide={handleHide}
                    />
                ))}
            </Carousel>

            <div className={styles.controls}>
                <label className={styles.label}>
                    <IconButton icon={Icons.currency} onClick={vm.onBuy} />
                    {intl.formatMessage({ id: 'BUY_EVER_BTN_TEXT' })}
                </label>

                <label className={styles.label}>
                    <IconButton icon={Icons.arrowDown} onClick={handleReceive} />
                    {intl.formatMessage({ id: 'RECEIVE_BTN_TEXT' })}
                </label>

                {vm.everWalletState && vm.isDeployed && (
                    <label className={styles.label}>
                        <IconButton icon={Icons.arrowUp} onClick={vm.onSend} />
                        {intl.formatMessage({ id: 'SEND_BTN_TEXT' })}
                    </label>
                )}

                {vm.everWalletState && vm.isDeployed && vm.stakingAvailable && (
                    <label className={classNames(styles.label, { [styles._alert]: vm.hasWithdrawRequest })}>
                        <IconButton icon={Icons.stake} onClick={vm.onStake} />
                        {intl.formatMessage({ id: 'STAKE_BTN_TEXT' })}
                    </label>
                )}

                {vm.everWalletState && !vm.isDeployed && (
                    <label className={styles.label}>
                        <IconButton icon={Icons.settings} onClick={vm.onDeploy} />
                        {intl.formatMessage({ id: 'DEPLOY_BTN_TEXT' })}
                    </label>
                )}
            </div>
        </div>
    )
})
