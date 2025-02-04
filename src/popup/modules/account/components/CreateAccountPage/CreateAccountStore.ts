import type * as nt from '@broxus/ever-wallet-wasm'
import { makeAutoObservable } from 'mobx'
import { singleton } from 'tsyringe'

import { AccountabilityStore, ConnectionStore, LocalizationStore, RpcStore } from '@app/popup/modules/shared'
import { closeCurrentWindow } from '@app/shared'

const PUBLIC_KEYS_LIMIT = 5

export interface PublicKey {
    publicKey: string;
    index: number;
}

@singleton()
export class CreateAccountStore {

    public password = ''

    public seed?: string = undefined

    constructor(
        private rpcStore: RpcStore,
        private accountability: AccountabilityStore,
        private localization: LocalizationStore,
        private connectionStore: ConnectionStore,
    ) {
        makeAutoObservable(this, undefined, { autoBind: true })

        this.seed = this.accountability.selectedMasterKey
    }

    public get masterKeys(): nt.KeyStoreEntry[] {
        return this.accountability.masterKeys
    }

    public get masterKey(): nt.KeyStoreEntry | undefined {
        return this.masterKeys.find(item => item.masterKey === this.seed)
    }

    public get accountsByKey(): Record<string, nt.AssetsList[] | undefined> {
        return Object.values(this.accountability.accountEntries).reduce((result, account) => {
            if (!result[account.tonWallet.publicKey]) {
                result[account.tonWallet.publicKey] = []
            }
            result[account.tonWallet.publicKey].push(account)
            return result
        }, {} as Record<string, nt.AssetsList[]>)
    }

    public setSeed(seed?: string): void {
        this.seed = seed
    }

    public setPassword(value: string): void {
        this.password = value
    }

    public async getAvailablePublicKey(contractType: nt.ContractType): Promise<PublicKey> {
        if (this.masterKey?.signerName === 'encrypted_key') {
            return {
                index: 0,
                publicKey: this.masterKey.publicKey,
            }
        }

        for await (const key of this.iteratePublicKeys()) {
            const accounts = this.accountsByKey[key.publicKey]
            if (!accounts || !accounts.length) {
                return key
            }
            if (!accounts.find(acc => acc.tonWallet.contractType === contractType)) {
                return key
            }
        }
        throw new Error(this.localization.intl.formatMessage({ id: 'CREATE_ACCOUNT_GENERIC_ERROR' }))
    }

    private async* iteratePublicKeys() {
        let page = 0

        while (page < 20) {
            const keys = await this.getPublicKeys(page)
            for (const key of keys) {
                yield key
            }
            page++
        }

        throw new Error(this.localization.intl.formatMessage({ id: 'CREATE_ACCOUNT_GENERIC_ERROR' }))
    }

    private async getPublicKeys(page = 0): Promise<PublicKey[]> {
        if (!this.masterKey) {
            throw new Error('masterKey muse be defined')
        }

        if (this.masterKey.signerName === 'ledger_key') {
            try {
                return this.rpcStore.rpc.getLedgerPage(page)
            }
            catch (e) {
                await this.connectLedger()
                throw e
            }
        }

        const rawPublicKeys = await this.rpcStore.rpc.getPublicKeys({
            type: 'master_key',
            data: {
                password: this.password,
                offset: page * PUBLIC_KEYS_LIMIT,
                limit: PUBLIC_KEYS_LIMIT,
                masterKey: this.masterKey.masterKey,
            },
        })

        return rawPublicKeys.map((publicKey, index) => ({
            publicKey,
            index: (PUBLIC_KEYS_LIMIT * page) + index,
        }))
    }

    private async connectLedger(): Promise<void> {
        await this.rpcStore.rpc.openExtensionInBrowser({
            route: 'ledger',
            force: true,
        })
        await closeCurrentWindow()
    }

}
