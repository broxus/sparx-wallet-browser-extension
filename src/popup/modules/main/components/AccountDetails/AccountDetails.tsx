import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'
import classNames from 'classnames'
import { useCallback } from 'react'

import DeployIcon from '@app/popup/assets/icons/settings.svg'
import CurrencyIcon from '@app/popup/assets/icons/currency.svg'
import ArrowDownIcon from '@app/popup/assets/icons/arrow-down.svg'
import ArrowUpIcon from '@app/popup/assets/icons/arrow-up.svg'
import StakeIcon from '@app/popup/assets/icons/stake.svg'
import { IconButton, useConfirmation, useViewModel } from '@app/popup/modules/shared'
import { Networks } from '@app/popup/modules/network'
import { ChangeAccountName } from '@app/popup/modules/account'

import { Receive } from '../Receive'
import { ChangeAccount } from '../ChangeAccount'
import { AccountCard, Carousel, OldAccountSettings } from './components'
import { AccountDetailsViewModel } from './AccountDetailsViewModel'

import './AccountDetails.scss'

interface Props {
    onVerifyAddress(address: string): void;
    onNetworkSettings(): void;
}

export const AccountDetails = observer(({ onVerifyAddress, onNetworkSettings }: Props): JSX.Element => {
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
    const handleRemove = useCallback(async (address: string) => {
        const confirmed = await confirmation.show({
            title: intl.formatMessage({ id: 'REMOVE_ACCOUNT_CONFIRMATION_TITLE' }),
            body: intl.formatMessage({ id: 'REMOVE_ACCOUNT_CONFIRMATION_TEXT' }),
            confirmBtnText: intl.formatMessage({ id: 'REMOVE_ACCOUNT_CONFIRMATION_BTN_TEXT' }),
        })

        if (confirmed) {
            await vm.removeAccount(address)
        }
    }, [])

    return (
        <div className="account-details">
            <div className="account-details__top-panel">
                <Networks onSettings={onNetworkSettings} />
                <OldAccountSettings />
            </div>

            <Carousel
                current={vm.carouselIndex}
                onAddAccount={vm.addAccount}
                onChangeAccount={handleChange}
                onChange={vm.onSlide}
            >
                {vm.accounts.map(({ tonWallet }) => (
                    <AccountCard
                        key={tonWallet.address}
                        address={tonWallet.address}
                        onRename={handleRename}
                        onRemove={handleRemove}
                        onVerify={onVerifyAddress}
                        onOpenInExplorer={vm.openAccountInExplorer}
                    />
                ))}
            </Carousel>

            <div className="account-details__controls">
                <label className="account-details__controls-label">
                    <IconButton icon={<CurrencyIcon />} onClick={vm.onBuy} />
                    {intl.formatMessage({ id: 'BUY_EVER_BTN_TEXT' })}
                </label>

                <label className="account-details__controls-label">
                    <IconButton icon={<ArrowDownIcon />} onClick={handleReceive} />
                    {intl.formatMessage({ id: 'RECEIVE_BTN_TEXT' })}
                </label>

                {vm.everWalletState && vm.isDeployed && (
                    <label className="account-details__controls-label">
                        <IconButton icon={<ArrowUpIcon />} onClick={vm.onSend} />
                        {intl.formatMessage({ id: 'SEND_BTN_TEXT' })}
                    </label>
                )}

                {vm.everWalletState && vm.isDeployed && vm.stakingAvailable && (
                    <label className={classNames('account-details__controls-label', { _alert: vm.hasWithdrawRequest })}>
                        <IconButton icon={<StakeIcon />} onClick={vm.onStake} />
                        {intl.formatMessage({ id: 'STAKE_BTN_TEXT' })}
                    </label>
                )}

                {vm.everWalletState && !vm.isDeployed && (
                    <label className="account-details__controls-label">
                        <IconButton icon={<DeployIcon />} onClick={vm.onDeploy} />
                        {intl.formatMessage({ id: 'DEPLOY_BTN_TEXT' })}
                    </label>
                )}
            </div>
        </div>
    )
})
