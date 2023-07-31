import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'

import { Container, Header, Navbar, PageLoader, Tabs, useViewModel } from '@app/popup/modules/shared'
import { TokenWalletsToUpdate } from '@app/models'

import { CustomToken, SearchToken } from './components'
import { ManageAssetsViewModel } from './ManageAssetsViewModel'
import './ManageAssets.scss'

enum Tab {
    Predefined,
    Custom,
}

export const ManageAssets = observer((): JSX.Element => {
    const vm = useViewModel(ManageAssetsViewModel)
    const intl = useIntl()
    const [activeTab, setActiveTab] = useState(Tab.Predefined)

    const existingTokens: TokenWalletsToUpdate = {}
    const tokens = vm.tokensManifest?.tokens?.map((token) => ({
        name: token.symbol,
        fullName: token.name,
        rootTokenContract: token.address,
        old: !!token.version && token.version < 5,
    })) ?? []

    for (const token of vm.tokenWalletAssets) {
        existingTokens[token.rootTokenContract] = true

        if (!vm.tokens?.[token.rootTokenContract]) {
            const symbol = vm.knownTokens[token.rootTokenContract]
            if (!symbol) {
                continue
            }

            tokens.push({
                name: symbol.name,
                fullName: symbol.fullName,
                rootTokenContract: symbol.rootTokenContract,
                old: symbol.version !== 'Tip3',
            })
        }
    }

    // TODO: hook?
    useEffect(() => {
        document.body.classList.add('bg-white')
        return () => document.body.classList.remove('bg-white')
    }, [])

    return (
        <Container className="manage-assets">
            <Header>
                <Navbar back="/">
                    <div className="manage-assets__header">
                        {intl.formatMessage({ id: 'USER_ASSETS_SELECT_ASSETS_HEADER' })}
                    </div>
                </Navbar>

                <Tabs className="manage-assets__tabs" tab={activeTab} onChange={setActiveTab}>
                    <Tabs.Tab id={Tab.Predefined}>
                        {intl.formatMessage({ id: 'USER_ASSETS_SELECT_ASSETS_TAB_SEARCH_LABEL' })}
                    </Tabs.Tab>
                    <Tabs.Tab id={Tab.Custom}>
                        {intl.formatMessage({ id: 'USER_ASSETS_SELECT_ASSETS_TAB_CUSTOM_TOKEN_LABEL' })}
                    </Tabs.Tab>
                </Tabs>
            </Header>

            {activeTab === Tab.Predefined && (
                <>
                    {vm.manifestLoading && <PageLoader />}
                    {!vm.manifestLoading && (
                        <SearchToken
                            existingTokens={existingTokens}
                            tokens={tokens}
                            loading={vm.loading}
                            onSubmit={vm.submit}
                        />
                    )}
                </>
            )}
            {activeTab === Tab.Custom && (
                <CustomToken
                    disabled={vm.loading}
                    error={vm.error}
                    onSubmit={vm.submit}
                />
            )}
        </Container>
    )
})
