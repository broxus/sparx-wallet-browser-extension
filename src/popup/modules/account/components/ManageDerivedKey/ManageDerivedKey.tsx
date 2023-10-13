import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'
import { Virtuoso } from 'react-virtuoso'

import { Icons } from '@app/popup/icons'
import { Button, Container, Content, EmptyPlaceholder, Footer, Header, Navbar, Scroller, SearchInput, SettingsMenu, Space, Tooltip, useCopyToClipboard, useSearch, useViewModel } from '@app/popup/modules/shared'

import { List } from '../List'
import { ChangeKeyName } from '../ChangeKeyName'
import { ShowPrivateKey } from '../ShowPrivateKey'
import { PageHeader } from '../PageHeader'
import { DeleteKey } from '../DeleteKey'
import { ManageDerivedKeyViewModel } from './ManageDerivedKeyViewModel'
import { AccountListItem } from './AccountListItem'

export const ManageDerivedKey = observer((): JSX.Element | null => {
    const vm = useViewModel(ManageDerivedKeyViewModel)
    const search = useSearch(vm.accounts, vm.filter)
    const copy = useCopyToClipboard()
    const intl = useIntl()

    const handleChangeName = () => vm.panel.open({
        render: () => <ChangeKeyName keyEntry={vm.currentDerivedKey!} derivedKey />,
    })
    const handleShowPrivateKey = () => vm.panel.open({
        render: () => <ShowPrivateKey keyEntry={vm.currentDerivedKey!} />,
    })
    const handleCopy = () => copy(
        vm.currentDerivedKey!.publicKey,
        intl.formatMessage({ id: 'MANAGE_DERIVED_KEY_COPIED_NOTIFICATION' }),
    )
    const handleDelete = () => vm.panel.open({
        render: () => <DeleteKey keyEntry={vm.currentDerivedKey!} onDeleted={vm.onKeyDeleted} />,
    })

    if (!vm.currentDerivedKey) return null

    return (
        <Container>
            <Header>
                <Navbar
                    back="../seed"
                    settings={(
                        <SettingsMenu title={intl.formatMessage({ id: 'KEY_SETTINGS_TITLE' })}>
                            <SettingsMenu.Item icon={Icons.edit} onClick={handleChangeName}>
                                {intl.formatMessage({ id: 'CHANGE_NAME_BTN_TEXT' })}
                            </SettingsMenu.Item>
                            <SettingsMenu.Item icon={Icons.copy} onClick={handleCopy}>
                                {intl.formatMessage({ id: 'COPY_PUBLIC_KEY_BTN_TEXT' })}
                            </SettingsMenu.Item>
                            {vm.currentDerivedKey.signerName !== 'ledger_key' && (
                                <SettingsMenu.Item icon={Icons.eye} onClick={handleShowPrivateKey}>
                                    {intl.formatMessage({ id: 'SHOW_PRIVATE_KEY_BTN_TEXT' })}
                                </SettingsMenu.Item>
                            )}
                            <SettingsMenu.Item
                                danger
                                icon={Icons.delete}
                                disabled={vm.isLast}
                                onClick={handleDelete}
                            >
                                {intl.formatMessage({ id: 'DELETE_KEY_BTN_TEXT' })}
                            </SettingsMenu.Item>
                        </SettingsMenu>
                    )}
                >
                    <PageHeader label={intl.formatMessage({ id: 'MANAGE_DERIVED_KEY_PLACEHOLDER_LABEL' })}>
                        {vm.currentDerivedKey.name}
                    </PageHeader>
                </Navbar>
            </Header>

            <Content>
                <Space direction="column" gap="l">
                    <SearchInput {...search.props} />

                    <List title={intl.formatMessage({ id: 'MANAGE_DERIVED_KEY_LISTS_ACCOUNTS_HEADER' })}>
                        <Virtuoso
                            customScrollParent={document.body}
                            components={{ EmptyPlaceholder, Scroller }}
                            fixedItemHeight={64}
                            data={search.list}
                            computeItemKey={(_, account) => account.tonWallet.address}
                            itemContent={(_, account) => (
                                <AccountListItem
                                    account={account}
                                    active={vm.selectedAccountAddress === account.tonWallet.address}
                                    visible={vm.accountsVisibility[account.tonWallet.address]}
                                    external={account.tonWallet.publicKey !== vm.currentDerivedKey?.publicKey}
                                    onChangeVisibility={vm.onChangeVisibility}
                                    onClick={vm.onManageAccount}
                                />
                            )}
                        />
                        <Tooltip
                            anchorSelect=".tooltip-anchor-element"
                            render={({ activeAnchor }) => {
                                if (!activeAnchor) return null
                                return activeAnchor.dataset.visible === 'true'
                                    ? intl.formatMessage({ id: 'MANAGE_DERIVED_KEY_ACCOUNT_HIDE_TOOLTIP' })
                                    : intl.formatMessage({ id: 'MANAGE_DERIVED_KEY_ACCOUNT_SHOW_TOOLTIP' })
                            }}
                        />
                    </List>
                </Space>
            </Content>

            <Footer>
                <Button onClick={vm.addAccount}>
                    {Icons.plus}
                    {intl.formatMessage({ id: 'MANAGE_DERIVED_KEY_LISTS_ACCOUNTS_ADD_NEW_BTN_TEXT' })}
                </Button>
            </Footer>
        </Container>
    )
})
