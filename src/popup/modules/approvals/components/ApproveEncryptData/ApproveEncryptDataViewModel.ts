import type * as nt from '@broxus/ever-wallet-wasm'
import { makeAutoObservable, runInAction } from 'mobx'
import { injectable } from 'tsyringe'

import { PendingApproval } from '@app/models'
import { AccountabilityStore, LocalizationStore, Utils } from '@app/popup/modules/shared'
import { parseError, prepareKey } from '@app/popup/utils'
import { LedgerUtils } from '@app/popup/modules/ledger'

import { ApprovalStore } from '../../store'
import { DataConverter, DisplayType } from '../../utils'

@injectable()
export class ApproveEncryptDataViewModel {

    public displayType = DisplayType.Base64

    public loading = false

    public error = ''

    public ledgerConnect = false

    constructor(
        public ledger: LedgerUtils,
        private approvalStore: ApprovalStore,
        private accountability: AccountabilityStore,
        private localization: LocalizationStore,
        private converter: DataConverter,
        private utils: Utils,
    ) {
        makeAutoObservable(this, undefined, { autoBind: true })

        utils.when(() => this.keyEntry?.signerName === 'ledger_key', async () => {
            const connected = await ledger.checkLedger()
            if (!connected) {
                runInAction(() => {
                    this.ledgerConnect = true
                })
            }
        })
    }

    public get approval(): PendingApproval<'encryptData'> {
        return this.approvalStore.approval as PendingApproval<'encryptData'>
    }

    public get keyEntry(): nt.KeyStoreEntry {
        return this.accountability.storedKeys[this.approval.requestData.publicKey]
    }

    public get account(): nt.AssetsList | undefined {
        return Object.values(this.accountability.accountEntries).find(
            account => account.tonWallet.publicKey === this.approval.requestData.publicKey,
        )
    }

    public get data(): string {
        return this.converter.convert(
            this.approval.requestData.data,
            this.displayType,
        )
    }

    public setDisplayType(displayType: DisplayType): void {
        this.displayType = displayType
    }

    public async onReject(): Promise<void> {
        this.loading = true
        await this.approvalStore.rejectPendingApproval()
    }

    public async onSubmit(password?: string, cache?: boolean): Promise<void> {
        if (this.loading) return

        if (!this.keyEntry) {
            this.error = this.localization.intl.formatMessage({ id: 'ERROR_KEY_ENTRY_NOT_FOUND' })
            return
        }

        this.loading = true
        this.error = ''

        try {
            const { keyEntry, account } = this
            const wallet = account!.tonWallet.contractType
            const keyPassword = prepareKey({ keyEntry, password, cache, wallet })
            const isValid = await this.utils.checkPassword(keyPassword)

            if (!isValid) {
                throw new Error(
                    this.localization.intl.formatMessage({ id: 'ERROR_INVALID_PASSWORD' }),
                )
            }

            await this.approvalStore.resolvePendingApproval(keyPassword, true)
        }
        catch (e: any) {
            runInAction(() => {
                this.error = parseError(e)
            })
        }
        finally {
            runInAction(() => {
                this.loading = false
            })
        }
    }

    public handleLedgerConnected(): void {
        this.ledgerConnect = false
    }

    public async handleLedgerFailed(): Promise<void> {
        await this.approvalStore.rejectPendingApproval()
    }

}
