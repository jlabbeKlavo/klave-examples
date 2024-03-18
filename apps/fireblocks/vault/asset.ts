import { JSON } from "@klave/sdk";
import { amount } from '../../klave/types';
import { Address } from './address';

@JSON
export class Asset {
    id: string;
    name: string;
    total: amount;
    balance: amount;
    available: boolean;
    pending: boolean;
    frozen: boolean;
    lockedAmount: amount;
    staked: amount;
    totalStakedCPU: i32;
    totalStakedNetwork: string;
    selfStakedCPU: i32;
    selfStakedNetwork: string;
    pendingRefundCPU: i32;
    pendingRefundNetwork: string;
    blockHeight: i32;
    blockHash: string;
    rewardsInfo: Array<string>;

    addresses: Array<Address>;

    constructor() {
        this.id = "";
        this.name = "";
        this.total = 0;
        this.balance = 0;
        this.available = true;
        this.pending = false;
        this.frozen = false;
        this.lockedAmount = 0;
        this.staked = 0;
        this.totalStakedCPU = 0;
        this.totalStakedNetwork = "";
        this.selfStakedCPU = 0;
        this.selfStakedNetwork = "";
        this.pendingRefundCPU = 0;
        this.pendingRefundNetwork = "";
        this.blockHeight = 0;
        this.blockHash = "";
        this.rewardsInfo = new Array<string>();        
        this.addresses = new Array<Address>();
    }

    getAddresses(): Array<Address> {
        return this.addresses;
    }    

    createAddress(description: string, customerRefId: string): Address {
        let address = new Address();
        address.description = description;
        address.customerRefId = customerRefId;
        this.addresses.push(address);
        return address;
    }

    getBalance(): amount {
        return this.balance;
    }

    refreshBalance(): void {
        //Unsure what needs to be done yet.        
    }    

    getTotal(): amount {
        return this.total;
    }
    
    getAddressesPaginated(before: string, after: string, limit: i32): Array<Address> {
        //Unsure what needs to be done yet.
        return this.addresses;
    }
}
