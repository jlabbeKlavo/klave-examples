import { Ledger, JSON } from "@klave/sdk";
import { emit, index, revert } from "../klave/types"
import { Wallet } from "./wallet";

const UsersTable = "UsersTable";

/**
 * Roles of the user in the wallet
 * - admin: can manage the wallet and its users
 * - internal user: can sign and verify transactions
 * - external user: can only sign transactions
 **/ 
@JSON
export class WalletUser {
    walletId: string;
    role: string;   

    constructor() {
        this.walletId = "";
        this.role = "";
    }
}

/**
 * Roles of the user in the vault
 * - admin: can manage the vault and its wallets
 * - user: can access one or more wallets
 */
@JSON
export class User {
    id: string;
    role: string;   //as in role for the vault itself, can be user of the vault and admin of a wallet
    wallets: Array<WalletUser>;
    

    constructor(id: string) {
        this.id = id;
        this.role = "";
        this.wallets = new Array<WalletUser>();
    }

    static load(userId: string) : User | null {
        let userTable = Ledger.getTable(UsersTable).get(userId);
        if (userTable.length == 0) {
            revert(`User ${userId} does not exist. Create it first`);
            return null;
        }
        let user = JSON.parse<User>(userTable);        
        emit(`User loaded successfully: '${user.id}'`);
        return user;
    }

    static loadWallet(userId: string, walletId: string) : WalletUser | null {
        let userTable = Ledger.getTable(UsersTable).get(userId);
        if (userTable.length == 0) {
            revert(`User ${userId} does not exist. Create it first`);
            return null;
        }
        let user = JSON.parse<User>(userTable);        

        let index = user.findIndex(walletId);
        if (index == -1) {
            return null;
        }

        emit(`User wallet profile loaded successfully: '${user.id}' for wallet '${walletId}'`);
        return user.wallets[index];
    }

    save(): void {
        let userTable = JSON.stringify<User>(this);
        Ledger.getTable(UsersTable).set(this.id, userTable);
        emit(`User saved successfully: '${this.id}'`);
    }

    delete(): void {
        for (let i = 0; i < this.wallets.length; i++) {
            let walletUser = this.wallets[i];
            let wallet = Wallet.load(walletUser.walletId);
            if (wallet) {
                wallet.removeUser(this.id, false);
                wallet.save();
            }
        }

        this.id = "";
        this.role = "";
        this.wallets = new Array<WalletUser>();
        Ledger.getTable(UsersTable).unset(this.id);
        emit(`User deleted successfully: '${this.id}'`);
    }

    findIndex(walletId: string): index {
        for (let i = 0; i < this.wallets.length; i++) {
            if (this.wallets[i].walletId == walletId) {
                return i;
            }
        }
        return -1;
    }

    addWallet(walletId: string, role: string): boolean {
        let index = this.findIndex(walletId);
        if (index != -1) {
            revert("User already has a profile for this wallet");
            return false;
        }
        let walletUser = new WalletUser();
        walletUser.walletId = walletId;
        walletUser.role = role;
        this.wallets.push(walletUser);
        emit(`Wallet successfully added to user: '${this.id}'`);
        return true;
    }

    removeWallet(walletId: string): boolean {
        let index = this.findIndex(walletId);
        if (index != -1) {
            revert("User already has a profile for this wallet");
            return false;
        }
        this.wallets.splice(index, 1);
        emit(`Wallet successfully removed from user: '${this.id}'`);
        return true;
    }

}
