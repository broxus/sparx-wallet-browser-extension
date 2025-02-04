import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { WithdrawRequest } from '@app/models'
import { SlidingPanelStore, StakeStore } from '@app/popup/modules/shared'
import { ST_EVER, ST_EVER_DECIMALS } from '@app/shared'

import { StakeTransferStore } from '../../store'

@injectable()
export class WithdrawRequestListViewModel {

    constructor(
        public panel: SlidingPanelStore,
        public transfer: StakeTransferStore,
        private stakeStore: StakeStore,
    ) {
        makeAutoObservable(this, undefined, { autoBind: true })
    }

    public get withdrawRequests(): WithdrawRequest[] {
        const { address } = this.transfer.account.tonWallet
        return Object.values(this.stakeStore.withdrawRequests[address] ?? {}) ?? []
    }

    public get currencyName(): string {
        return ST_EVER
    }

    public get decimals(): number {
        return ST_EVER_DECIMALS
    }

}
