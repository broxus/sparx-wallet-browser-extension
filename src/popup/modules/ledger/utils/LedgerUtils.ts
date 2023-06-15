import type * as nt from '@broxus/ever-wallet-wasm'
import { inject, injectable } from 'tsyringe'
import { makeAutoObservable, runInAction } from 'mobx'

import type { Nekoton } from '@app/models'
import { NekotonToken, RpcStore } from '@app/popup/modules/shared'
import { prepareLedgerSignatureContext, PrepareLedgerSignatureContextParams } from '@app/popup/utils'

@injectable()
export class LedgerUtils {

    loading = false

    constructor(
        @inject(NekotonToken) private nekoton: Nekoton,
        private rpcStore: RpcStore,
    ) {
        makeAutoObservable(this, undefined, { autoBind: true })
    }

    public async checkLedger(): Promise<boolean> {
        try {
            runInAction(() => {
                this.loading = true
            })
            await this.rpcStore.rpc.getLedgerMasterKey()
            return true
        }
        catch (e) {
            return false
        }
        finally {
            runInAction(() => {
                this.loading = false
            })
        }
    }

    public async checkLedgerMasterKey(key: nt.KeyStoreEntry/* & { signerName: 'ledger_key' } */): Promise<boolean> {
        try {
            const masterKey = await this.rpcStore.rpc.getLedgerMasterKey()
            return masterKey === key.masterKey
        }
        catch (e: any) {
            await this.rpcStore.rpc.openExtensionInBrowser({
                route: 'ledger',
                force: true,
            })
            window.close()
        }

        return false
    }

    public prepareContext(params: PrepareLedgerSignatureContextParams): nt.LedgerSignatureContext {
        return prepareLedgerSignatureContext(this.nekoton, params)
    }

}
