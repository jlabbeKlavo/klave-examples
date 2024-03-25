import { Ledger, JSON, Crypto } from "@klave/sdk";
import { emit, index, revert } from "../klave/types"
import { ChainedItems } from "../klave/chained";
import { encode as b64encode } from 'as-base64/assembly';
import { convertToUint8Array } from "../klave/helpers";
import { Wallet } from "./wallet";

const WalletUsersTable = "WalletUsersTable";

/**
 * Roles of the user in the wallet
 * - admin: can manage the wallet and its users
 * - internal user: can sign and verify transactions
 * - external user: can only sign transactions
 **/ 
@JSON
export class WalletUser {
    id: string;
    walletId: string;
    role: string;   

    constructor(walletId: string, role: string) {
        this.id = b64encode(convertToUint8Array(Crypto.getRandomValues(64)));
        this.walletId = walletId;
        this.role = role;
    }

    static load(id: string) : WalletUser | null {
        let userTable = Ledger.getTable(WalletUsersTable).get(id);
        if (userTable.length == 0) {
            revert(`WalletUser ${id} does not exist. Create it first`);
            return null;
        }
        let user = JSON.parse<WalletUser>(userTable);        
        emit(`User wallet profile loaded successfully: '${user.id}' for wallet '${user.walletId}'`);
        return user;
    }

    save(): void {
        let userTable = JSON.stringify<WalletUser>(this);
        Ledger.getTable(WalletUsersTable).set(this.id, userTable);
        emit(`User saved successfully: '${this.id}'`);
    }

    create(walletId: string, role: string): boolean {        
        this.id = b64encode(convertToUint8Array(Crypto.getRandomValues(64)));
        this.walletId = walletId;
        this.role = role;
        emit(`Wallet successfully added to user: '${this.id}'`);
        return true;
    }
}

export class ChainedWalletUsers extends ChainedItems<WalletUser> {
    constructor() {
        super();
    }    

    includes(walletId: string): index {
        let all = this.getAll();
        for (let i = 0; i < all.length; i++) {            
            let item = all[i];
            if (item.walletId == walletId) {
                return i;
            }
        }
        return -1;
    }

    remove(walletId: string): void {
        let all = this.getAll();
        for (let i = 0; i < all.length; i++) {
            let item = all[i];
            if (item.walletId == walletId) {
                this.removeIndex(i);
                break;
            }
        }
    }

    add(user: WalletUser) : void {
        this.add_with_id(user, user.id);
    }   
    
    getNames(): string {
        let str = "";
        let all = this.getAll();
        for (let i = 0; i < all.length; i++) {            
            let item = all[i];
            if (str.length > 0) {
                str += ", ";
            }
            let wallet = Wallet.load(item.walletId);
            if (wallet) {
                str += wallet.name;
            }
        }
        return str;
    }    
}
