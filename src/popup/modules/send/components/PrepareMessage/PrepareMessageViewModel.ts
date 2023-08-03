import type * as nt from '@broxus/ever-wallet-wasm'
import BigNumber from 'bignumber.js'
import { makeAutoObservable } from 'mobx'
import { inject, injectable } from 'tsyringe'
import type { ErrorOption } from 'react-hook-form'

import type { ConnectionDataItem, Nekoton, TokenMessageToPrepare, TransferMessageToPrepare } from '@app/models'
import { AccountabilityStore, ConnectionStore, LocalizationStore, Logger, NekotonToken, type Router, RouterToken, RpcStore, Token, TokensStore } from '@app/popup/modules/shared'
import { isNativeAddress, MULTISIG_UNCONFIRMED_LIMIT, NATIVE_CURRENCY_DECIMALS, parseCurrency, parseEvers, SelectedAsset, TokenWalletState } from '@app/shared'
import { ContactsStore } from '@app/popup/modules/contacts'
import { LedgerUtils } from '@app/popup/modules/ledger'

import { MessageParams, SendPageStore } from '../../store'

@injectable()
export class PrepareMessageViewModel {

    public setFormError!: (field: keyof MessageFormData, error: ErrorOption) => void

    public loading = false

    public error = ''

    public commentVisible = false

    constructor(
        public store: SendPageStore,
        @inject(RouterToken) private router: Router,
        @inject(NekotonToken) private nekoton: Nekoton,
        private rpcStore: RpcStore,
        private accountability: AccountabilityStore,
        private localization: LocalizationStore,
        private connectionStore: ConnectionStore,
        private contactsStore: ContactsStore,
        private tokensStore: TokensStore,
        private ledger: LedgerUtils,
        private logger: Logger,
    ) {
        makeAutoObservable(this, undefined, { autoBind: true })
    }

    public get account(): nt.AssetsList {
        return this.store.account
    }

    public get asset(): SelectedAsset {
        return this.store.asset
    }

    public get key(): nt.KeyStoreEntry | undefined {
        return this.store.key
    }

    public get everWalletState(): nt.ContractState | undefined {
        return this.accountability.accountContractStates[this.account.tonWallet.address]
    }

    public get tokenWalletStates(): Record<string, TokenWalletState> {
        return this.accountability.accountTokenStates?.[this.account.tonWallet.address] ?? {}
    }

    public get knownTokens(): Record<string, nt.Symbol> {
        return this.rpcStore.state.knownTokens
    }

    public get symbol(): nt.Symbol | undefined {
        if (this.asset.type === 'ever_wallet') return undefined
        return this.knownTokens[this.asset.data.rootTokenContract]
    }

    public get token(): Token | undefined {
        if (this.asset.type === 'ever_wallet') return undefined
        return this.tokensStore.tokens[this.asset.data.rootTokenContract]
    }

    public get selectedConnection(): ConnectionDataItem {
        return this.rpcStore.state.selectedConnection
    }

    public get everWalletAsset(): nt.TonWalletAsset {
        return this.account.tonWallet
    }

    public get accountDetails(): Record<string, nt.TonWalletDetails> {
        return this.accountability.accountDetails
    }

    public get walletInfo(): nt.TonWalletDetails {
        const { address, contractType } = this.everWalletAsset
        return this.accountDetails[address] ?? this.nekoton.getContractTypeDefaultDetails(contractType)
    }

    public get balance(): BigNumber {
        return this.asset.type === 'token_wallet'
            ? new BigNumber(this.tokenWalletStates[this.asset.data.rootTokenContract]?.balance || '0')
            : new BigNumber(this.everWalletState?.balance || '0')
    }

    public get decimals(): number | undefined {
        return this.asset.type === 'token_wallet' ? this.symbol?.decimals : NATIVE_CURRENCY_DECIMALS
    }

    public get currencyName(): string | undefined {
        return this.asset.type === 'token_wallet'
            ? this.token?.symbol ?? this.symbol?.name
            : this.connectionStore.symbol
    }

    public get old(): boolean {
        if (this.symbol) {
            return this.symbol.version !== 'Tip3'
        }

        return false
    }

    public get accountUnconfirmedTransactions() {
        return this.rpcStore.state.accountUnconfirmedTransactions
    }

    public get isMultisigLimit(): boolean {
        const { requiredConfirmations } = this.walletInfo
        const { address } = this.everWalletAsset

        if (!requiredConfirmations || requiredConfirmations === 1) return false

        return Object.keys(
            this.accountUnconfirmedTransactions[address] ?? {},
        ).length >= MULTISIG_UNCONFIRMED_LIMIT
    }

    public onChangeAsset(asset: SelectedAsset): void {
        this.store.setAsset(asset)
    }

    public onChangeKeyEntry(value: nt.KeyStoreEntry): void {
        this.store.setKey(value)

        if (this.store.messageParams) {
            this.submit({
                amount: this.store.messageParams.originalAmount,
                recipient: this.store.messageParams.recipient,
                comment: this.store.messageParams.comment,
                notify: this.store.messageParams.notify,
            }).catch(this.logger.error)
        }
    }

    public async submit(data: MessageFormData): Promise<void> {
        if (!this.key) {
            this.error = this.localization.intl.formatMessage({
                id: 'ERROR_SIGNER_KEY_NOT_SELECTED',
            })
            return
        }

        let messageParams: MessageParams,
            messageToPrepare: TransferMessageToPrepare

        const { address, densPath } = await this.contactsStore.resolveAddress(data.recipient.trim())

        if (!address) {
            this.setFormError('recipient', { type: 'invalid' })
            return
        }

        await this.contactsStore.addRecentContacts([{ type: 'address', value: densPath ?? address }])

        if (this.asset.type === 'ever_wallet') {
            messageToPrepare = {
                publicKey: this.key.publicKey,
                recipient: this.nekoton.repackAddress(address), // shouldn't throw exceptions due to higher level validation
                amount: parseEvers(data.amount.trim()),
                payload: data.comment ? this.nekoton.encodeComment(data.comment) : undefined,
            }
            messageParams = {
                amount: { type: 'ever_wallet', data: { amount: messageToPrepare.amount }},
                originalAmount: data.amount,
                recipient: densPath ?? address,
                comment: data.comment,
                notify: data.notify,
            }
        }
        else {
            if (typeof this.decimals !== 'number') {
                this.error = 'Invalid decimals'
                return
            }

            const tokenAmount = parseCurrency(data.amount.trim(), this.decimals)
            const tokenRecipient = this.nekoton.repackAddress(address)

            const internalMessage = await this.prepareTokenMessage(
                this.everWalletAsset.address,
                this.asset.data.rootTokenContract,
                {
                    amount: tokenAmount,
                    recipient: tokenRecipient,
                    payload: data.comment ? this.nekoton.encodeComment(data.comment) : undefined,
                    notifyReceiver: data.notify,
                },
            )

            messageToPrepare = {
                publicKey: this.key.publicKey,
                recipient: internalMessage.destination,
                amount: internalMessage.amount,
                payload: internalMessage.body,
            }
            messageParams = {
                amount: {
                    type: 'token_wallet',
                    data: {
                        amount: tokenAmount,
                        attachedAmount: internalMessage.amount,
                        symbol: this.currencyName || '',
                        decimals: this.decimals,
                        rootTokenContract: this.asset.data.rootTokenContract,
                        old: this.old,
                    },
                },
                originalAmount: data.amount,
                recipient: densPath ?? address,
                comment: data.comment,
                notify: data.notify,
            }
        }

        this.store.submitMessageParams(messageParams, messageToPrepare)
        this.router.navigate('/confirm')
    }

    public validateAddress(value: string): boolean {
        return !!value
            && (value !== this.account.tonWallet.address || this.asset.type === 'ever_wallet') // can't send tokens to myself
            && (this.nekoton.checkAddress(value) || !isNativeAddress(value))
    }

    public validateAmount(value?: string): boolean {
        if (this.decimals == null) {
            return false
        }
        try {
            const current = new BigNumber(
                parseCurrency(value || '', this.decimals),
            )

            if (this.asset.type === 'ever_wallet') {
                return current.isGreaterThanOrEqualTo(this.walletInfo.minAmount)
            }

            return current.isGreaterThan(0)
        }
        catch (e: any) {
            return false
        }
    }

    public validateBalance(value?: string): boolean {
        if (this.decimals == null) {
            return false
        }
        try {
            const current = new BigNumber(
                parseCurrency(value || '', this.decimals),
            )
            return current.isLessThanOrEqualTo(this.balance)
        }
        catch (e: any) {
            return false
        }
    }

    public showComment(): void {
        this.commentVisible = true
    }

    public isDens(address: string | undefined): boolean {
        return !!address && !this.nekoton.checkAddress(address) && !isNativeAddress(address)
    }

    private prepareTokenMessage(
        owner: string,
        rootTokenContract: string,
        params: TokenMessageToPrepare,
    ): Promise<nt.InternalMessage> {
        return this.rpcStore.rpc.prepareTokenMessage(owner, rootTokenContract, params)
    }

}

export interface MessageFormData {
    amount: string;
    comment?: string;
    recipient: string;
    notify: boolean;
}
