import { Ledger, JSON } from "@klave/sdk";
import { emit, index, revert } from "../klave/types"

const UsersTable = "UsersTable";

@JSON
export class WalletUser {
    walletId: string;
    role: string;   // admin, user, etc.

    constructor() {
        this.walletId = "";
        this.role = "";
    }
}

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
            revert(`User ${userId} does not exists. Create it first`);
            return null;
        }
        let user = JSON.parse<User>(userTable);        
        emit(`User loaded successfully: '${user.id}'`);
        return user;
    }

    static loadWallet(userId: string, walletId: string) : WalletUser | null {
        let userTable = Ledger.getTable(UsersTable).get(userId);
        if (userTable.length == 0) {
            revert(`User ${userId} does not exists. Create it first`);
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
        this.id = "";
        this.role = "";
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
