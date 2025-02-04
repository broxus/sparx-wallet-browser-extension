import type * as nt from '@broxus/ever-wallet-wasm'
import { action, computed, makeObservable, observable, runInAction } from 'mobx'

import type { LedgerUtils } from '@app/popup/modules/ledger'
import type { TransferMessageToPrepare, WalletMessageToSend } from '@app/models'

import { Logger, Utils } from '../utils'
import { RpcStore } from './RpcStore'
import { AccountabilityStore, SelectableKeys } from './AccountabilityStore'
import { LocalizationStore } from './LocalizationStore'

type AdditionalKeys =
    | '_ledgerConnect'
    | '_initialized'
    | '_account'
    | '_key'
    | '_messageParams'
    | '_messageToPrepare'
    | '_fees'
    | '_txErrors'

export abstract class TransferStore<P> {

    protected _ledgerConnect = false

    protected _account: nt.AssetsList | undefined

    protected _key: nt.KeyStoreEntry | undefined

    protected _messageParams: P | undefined

    protected _messageToPrepare: TransferMessageToPrepare | undefined

    protected _fees = ''

    protected _txErrors: nt.TransactionTreeSimulationError[] = []

    private _initialized = false

    protected constructor(
        protected rpcStore: RpcStore,
        protected accountability: AccountabilityStore,
        protected logger: Logger,
        protected ledger: LedgerUtils,
        protected utils: Utils,
        protected localization: LocalizationStore,
    ) {
        makeObservable<TransferStore<P>, AdditionalKeys>(this, {
            _ledgerConnect: observable,
            _initialized: observable,
            _account: observable,
            _key: observable,
            _messageParams: observable,
            _messageToPrepare: observable,
            _fees: observable,
            _txErrors: observable,
            initialized: computed,
            account: computed,
            key: computed,
            messageParams: computed,
            messageToPrepare: computed,
            fees: computed,
            selectableKeys: computed,
            ledgerConnect: computed,
            handleLedgerConnected: action.bound,
            setKey: action.bound,
            submitMessageParams: action.bound,
            resetMessageParams: action.bound,
        })

        utils.when(() => {
            const { selectedAccount, everWalletState } = this.accountability
            return !!selectedAccount && !!everWalletState
        }, () => this._initialize(this.accountability.selectedAccount!, this.accountability.everWalletState!))

        utils.when(() => this.initialized && !!this.selectableKeys.keys[0], () => {
            this._key = this.selectableKeys.keys[0]
        })

        utils.when(() => this._key?.signerName === 'ledger_key', async () => {
            const connected = await ledger.checkLedger()
            if (!connected) {
                runInAction(() => {
                    this._ledgerConnect = true
                })
            }
        })

        utils.reaction(() => this._key?.publicKey, () => {
            if (this._messageToPrepare && this._key) {
                this._messageToPrepare.publicKey = this._key.publicKey
            }
        })

        utils.autorun(() => {
            if (this.messageToPrepare) {
                this.estimateFees(this.messageToPrepare).catch(logger.error)
                this.simulateTransactionTree(this.messageToPrepare).catch(logger.error)
            }
        })
    }

    protected abstract initialize(account: nt.AssetsList, everWalletState: nt.ContractState): Promise<void> | void;

    public get initialized(): boolean {
        return this._initialized
    }

    public get account(): nt.AssetsList {
        if (!this._account) throw new Error('[TransferStore] not initialized')
        return this._account
    }

    public get key(): nt.KeyStoreEntry | undefined {
        return this._key
    }

    public get messageParams(): P | undefined {
        return this._messageParams
    }

    public get messageToPrepare(): TransferMessageToPrepare | undefined {
        return this._messageToPrepare
    }

    public get fees(): string {
        return this._fees
    }

    public get txErrors(): nt.TransactionTreeSimulationError[] {
        return this._txErrors
    }

    public get selectableKeys(): SelectableKeys {
        return this.accountability.getSelectableKeys(this.account)
    }

    public get ledgerConnect(): boolean {
        return this._ledgerConnect
    }

    public handleLedgerConnected(): void {
        this._ledgerConnect = false
    }

    public setKey(key: nt.KeyStoreEntry): void {
        this._key = key
    }

    public submitMessageParams(messageParams: P, messageToPrepare: TransferMessageToPrepare): void {
        this._messageParams = messageParams
        this._messageToPrepare = messageToPrepare
    }

    public resetMessageParams(): void {
        this._messageParams = undefined
        this._messageToPrepare = undefined
    }

    public async submitPassword(password: nt.KeyPassword): Promise<void> {
        if (this.key?.signerName === 'ledger_key') {
            const found = await this.ledger.checkLedgerMasterKey(this.key)
            if (!found) {
                throw new Error(
                    this.localization.intl.formatMessage({ id: 'ERROR_LEDGER_KEY_NOT_FOUND' }),
                )
            }
        }

        const isValid = await this.utils.checkPassword(password)
        if (!isValid) {
            throw new Error(
                this.localization.intl.formatMessage({ id: 'ERROR_INVALID_PASSWORD' }),
            )
        }

        const messageToPrepare = this.messageToPrepare!
        const signedMessage = await this.prepareMessage(messageToPrepare, password)

        await this.sendMessage({
            signedMessage,
            info: {
                type: 'transfer',
                data: {
                    amount: messageToPrepare.amount,
                    recipient: messageToPrepare.recipient,
                },
            },
        })
    }

    protected prepareMessage(
        params: TransferMessageToPrepare,
        password: nt.KeyPassword,
    ): Promise<nt.SignedMessage> {
        return this.rpcStore.rpc.prepareTransferMessage(this.account.tonWallet.address, params, password)
    }

    protected sendMessage(message: WalletMessageToSend): Promise<void> {
        return this.rpcStore.rpc.sendMessage(this.account.tonWallet.address, message)
    }

    protected async estimateFees(params: TransferMessageToPrepare) {
        try {
            const fees = await this.rpcStore.rpc.estimateFees(this.account.tonWallet.address, params, {})
            runInAction(() => {
                this._fees = fees
            })
        }
        catch (e) {
            this.logger.error(e)
        }
    }

    protected async simulateTransactionTree(params: TransferMessageToPrepare) {
        runInAction(() => {
            this._txErrors = []
        })

        try {
            const errors = await this.rpcStore.rpc.simulateTransactionTree(this.account.tonWallet.address, params)
            runInAction(() => {
                this._txErrors = errors
            })
        }
        catch (e) {
            this.logger.error(e)
        }
    }

    private async _initialize(account: nt.AssetsList, everWalletState: nt.ContractState): Promise<void> {
        await this.initialize(account, everWalletState)
        runInAction(() => {
            this._initialized = true
        })
    }

}
