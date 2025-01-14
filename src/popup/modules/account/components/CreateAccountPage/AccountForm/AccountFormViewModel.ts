import type * as nt from '@broxus/ever-wallet-wasm'
import { makeAutoObservable, runInAction } from 'mobx'
import { inject, injectable } from 'tsyringe'

import { AccountabilityStore, ConnectionStore, LocalizationStore, NekotonToken, NotificationStore, Router, RpcStore } from '@app/popup/modules/shared'
import { ContractEntry, getDefaultWalletContracts, getOtherWalletContracts } from '@app/shared'
import { NetworkType, type Nekoton } from '@app/models'
import { CreateAccountStore } from '@app/popup/modules/account/components/CreateAccountPage/CreateAccountStore'
import { parseError } from '@app/popup/utils'

@injectable()
export class AccountFormViewModel {

    public loading = false

    constructor(
        private rpcStore: RpcStore,
        private accountability: AccountabilityStore,
        private localization: LocalizationStore,
        @inject(NekotonToken) private nekoton: Nekoton,
        private createAccount: CreateAccountStore,
        private notification: NotificationStore,
        private connectionStore: ConnectionStore,
        private router: Router,
    ) {
        makeAutoObservable(this, undefined, { autoBind: true })
    }

    public get selectedConnectionNetworkType(): NetworkType {
        return this.connectionStore.selectedConnectionNetworkType
    }

    public get defaultAccountName() {
        const accountId = this.createAccount.publicKey?.index ?? 0
        return this.localization.intl.formatMessage(
            { id: 'ACCOUNT_GENERATED_NAME' },
            { accountId: this.createAccount.keyIndex + 1, number: accountId + 1 },
        )
    }

    public get defaultContracts(): ContractEntry[] {
        const { currentDerivedKey } = this.accountability
        const defaultWalletContracts = getDefaultWalletContracts(
            this.connectionStore.selectedConnectionNetworkType,
        )

        if (!currentDerivedKey) {
            return defaultWalletContracts
        }

        const accountAddresses = new Set(
            this.accountability.currentDerivedKeyAccounts.map(
                account => account.tonWallet.address,
            ),
        )

        return defaultWalletContracts.filter(type => {
            const address = this.nekoton.computeTonWalletAddress(currentDerivedKey.publicKey, type.type, 0)
            return !accountAddresses.has(address)
        })
    }

    public get otherContracts(): ContractEntry[] {
        const { currentDerivedKey } = this.accountability
        const otherWalletContracts = getOtherWalletContracts(
            this.connectionStore.selectedConnectionNetworkType,
        )

        if (!currentDerivedKey) {
            return otherWalletContracts
        }

        const accountAddresses = new Set(
            this.accountability.currentDerivedKeyAccounts.map(
                account => account.tonWallet.address,
            ),
        )

        return otherWalletContracts.filter(type => {
            const address = this.nekoton.computeTonWalletAddress(currentDerivedKey.publicKey, type.type, 0)
            return !accountAddresses.has(address)
        })
    }

    public async onSubmit(contractType: nt.ContractType, name: string): Promise<void> {
        if (this.loading) return
        this.loading = true
        const publicKey = this.createAccount.publicKey
        const masterKey = this.createAccount.masterKey

        try {
            if (!publicKey) {
                throw new Error('createAccount.publicKey must be defined')
            }

            if (!masterKey) {
                throw new Error('createAccount.masterKey must be defined')
            }

            const hasDerivedKey = this.accountability.derivedKeys
                .some(item => item.publicKey === publicKey.publicKey)

            if (!hasDerivedKey) {
                // create derived key
                if (masterKey.signerName === 'ledger_key') {
                    await this.rpcStore.rpc.createLedgerKey({ accountId: publicKey.index })
                }
                else {
                    await this.rpcStore.rpc.createDerivedKey({
                        accountId: publicKey.index,
                        masterKey: masterKey.masterKey,
                        password: this.createAccount.password,
                    })
                }
            }

            const account = await this.rpcStore.rpc.createAccount({
                contractType,
                name,
                publicKey: publicKey.publicKey,
                workchain: 0,
            })
            this.router.navigate(`/success/${account.tonWallet.address}`)
        }
        catch (e: any) {
            this.notification.error(parseError(e))
        }
        finally {
            runInAction(() => {
                this.loading = false
            })
        }
    }

}
