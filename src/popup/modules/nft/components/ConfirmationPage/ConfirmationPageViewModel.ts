import type * as nt from '@broxus/ever-wallet-wasm'
import { makeAutoObservable, runInAction } from 'mobx'
import { injectable } from 'tsyringe'
import BigNumber from 'bignumber.js'

import { closeCurrentWindow, NATIVE_CURRENCY_DECIMALS } from '@app/shared'
import { parseError } from '@app/popup/utils'
import { LedgerUtils } from '@app/popup/modules/ledger'
import { AccountabilityStore, ConnectionStore, LocalizationStore } from '@app/popup/modules/shared'

import { NftTransferStore } from '../../store'

@injectable()
export class ConfirmationPageViewModel {

    public error = ''

    public loading = false

    constructor(
        public transfer: NftTransferStore,
        private accountability: AccountabilityStore,
        private localization: LocalizationStore,
        private connectionStore: ConnectionStore,
        private ledger: LedgerUtils,
    ) {
        makeAutoObservable(this, undefined, { autoBind: true })
    }

    public get everWalletState(): nt.ContractState | undefined {
        return this.accountability.accountContractStates[this.transfer.account.tonWallet.address]
    }

    public get nativeCurrency(): string {
        return this.connectionStore.symbol
    }

    public get context(): nt.LedgerSignatureContext | undefined {
        if (!this.transfer.key) return undefined

        return this.ledger.prepareContext({
            type: 'transfer',
            everWallet: this.transfer.account.tonWallet,
            custodians: this.accountability.accountCustodians[this.transfer.account.tonWallet.address],
            key: this.transfer.key,
            decimals: this.decimals,
            asset: this.nativeCurrency,
        })
    }

    public get balanceError(): string | undefined {
        if (!this.transfer.fees || !this.transfer.messageParams) return undefined

        const fees = new BigNumber(this.transfer.fees)
        const amount = new BigNumber(this.transfer.messageParams.amount.data.amount)

        if (this.balance.isLessThan(amount.plus(fees))) {
            return this.localization.intl.formatMessage({ id: 'ERROR_INSUFFICIENT_BALANCE' })
        }

        return undefined
    }

    public get balance(): BigNumber {
        return new BigNumber(this.everWalletState?.balance || '0')
    }

    public get decimals(): number {
        return NATIVE_CURRENCY_DECIMALS
    }

    public async submit(password: nt.KeyPassword): Promise<void> {
        if (this.loading) return

        this.error = ''
        this.loading = true

        try {
            await this.transfer.submitPassword(password)
            await closeCurrentWindow() // result page?
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

}
