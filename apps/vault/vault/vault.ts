import { Ledger, JSON, Context } from "@klave/sdk";
import { emit, revert } from "../klave/types";
import { Wallet } from "./wallet";
import { User } from "./user";

const VaultTable = "VaultTable";

/**
 * An Vault is associated with a list of users and holds keys.
 */
@JSON
export class Vault {    
    name: string;
    wallets: Array<string>;
    users: Array<string>;

    constructor() {
        this.name = "";
        this.wallets = new Array<string>();
        this.users = new Array<string>();
    }
    
    /**
     * load the wallet from the ledger.
     * @returns true if the wallet was loaded successfully, false otherwise.
     */
    static load(): Vault | null {
        let vaultTable = Ledger.getTable(VaultTable).get("ALL");
        if (vaultTable.length == 0) {
            revert("Vault does not exists. Create it first");
            return null;
        }
        let wlt = JSON.parse<Vault>(vaultTable);
        emit("Vault loaded successfully: " + vaultTable);
        return wlt;
    }
 
    /**
     * save the wallet to the ledger.
     */
    save(): void {
        let vaultTable = JSON.stringify<Vault>(this);
        Ledger.getTable(VaultTable).set("ALL", vaultTable);
        emit("Vault saved successfully: " + vaultTable);
    }

    /**
     * rename the wallet.
     * @param newName 
     */
    rename(oldName: string, newName: string): void {        
        if (!this.senderIsAdmin())
        {
            revert("You are not allowed to rename the wallet");
            return;
        }
        if (this.name != oldName) {
            revert("Vault name does not match");
            return;
        }
        this.name = newName;
        emit("Vault renamed successfully");
    }

    /**
     * Create a wallet with the given name.
     * Also adds the sender as an admin user.
     * @param name 
     */
    create(name: string): void {
        this.name = name;
        this.createUser(Context.get('sender'), "admin", true);
        emit("Vault created successfully: " + this.name);        
        return;
    }
    
    /**
     * Add a user to the wallet.
     * @param userId The id of the user to add.
     * @param role The role of the user to add.
     */
    createUser(userId: string, role: string, force: boolean): boolean {
        if (!force && !this.senderIsAdmin())
        {
            revert("You are not allowed to add a user");
            return false;
        }

        let existingUser = User.load(userId);
        if (existingUser) {
            revert("User already exists: " + userId);
            return false;
        }
        let user = new User(userId);
        user.role = role;
        user.save();
        this.users.push(userId);        
        emit("User added successfully: " + userId);
        return true;
    }

    /**
     * Remove a user from the wallet.
     * @param userId The id of the user to remove.
     */
    deleteUser(userId: string): boolean {
        if (!this.senderIsAdmin())
        {
            revert("You are not allowed to remove a user");
            return false;
        }
        
        let user = User.load(userId);
        if (!user) {
            revert("User not found: " + userId);
            return false;
        }
        user.delete();

        let index = this.users.indexOf(userId);
        this.users.splice(index, 1);
        emit("User removed successfully: " + userId);
        return true;
    }

    /**
     * Check if the sender is an admin.
     * @returns True if the sender is an admin, false otherwise.
     */
    senderIsAdmin(): boolean {
        let user = User.load(Context.get('sender'));
        if (!user) {
            return false;
        }
        return user.role == "admin";
    }

    /**
     * Check if the sender is registered.
     * @returns True if the sender is registered, false otherwise.
     */
    senderIsRegistered(): boolean {
        let user = User.load(Context.get('sender'));
        if (!user) {
            return false;
        }
        return true;
    }

    /**
     * create a wallet with the given name.
     */
    createWallet(walletName: string): void {
        if (!this.senderIsAdmin())
        {
            revert("You are not allowed to create a wallet");
            return;
        }

        let wallet = Wallet.load(walletName);
        if (wallet) {
            revert(`Wallet ${walletName} already exists`);
            return;
        }
        wallet = new Wallet();
        wallet.create(walletName);
        this.wallets.push(wallet.id);
        emit("Wallet created successfully: " + wallet.id);
    }

    /**
     * delete a wallet with the given id.
     */
    deleteWallet(walletId: string): void {
        if (!this.senderIsAdmin())
        {
            revert("You are not allowed to delete a wallet");
            return;
        }

        let wallet = Wallet.load(walletId);
        if (!wallet) {
            revert(`Wallet ${walletId} does not exist`);
            return;
        }
        wallet.delete();
        let index = this.wallets.indexOf(walletId);
        this.wallets.splice(index, 1);
        emit("Wallet deleted successfully: " + walletId);
    }

    /**
     * list all the keys in the wallet.
     * @returns 
     */
    listWallets(user: string): void {
        if (!this.senderIsRegistered())
        {
            revert("You are not allowed to list the keys in the wallet");
            return;
        }        

        let wallets: string = "";
        for (let i = 0; i < this.wallets.length; i++) {
            let walletId = this.wallets[i];
            let walletObj = Wallet.load(walletId);
            if (!walletObj) {
                revert(`Wallet ${walletId} does not exist`);
                continue;
            }            
            if (wallets.length > 0) {
                wallets += ", ";
            }
            if (user.length == 0 || walletObj.userIsRegistered(user)) {
                wallets += JSON.stringify<Wallet>(walletObj);
            }
        }
        if (wallets.length == 0) {
            emit(`No wallets found in the wallet`);
        }
        emit(`Keys in the wallet: ${wallets}`);
    }

    /**
     * reset the wallet to its initial state.
     * @returns 
     */
    reset(wallets: Array<string>): void {
        if (!this.senderIsAdmin())
        {
            revert("You are not allowed to reset the wallet");
            return;
        }

        if (wallets.length == 0) {
            this.name = "";        
            this.wallets = new Array<string>();
            this.users = new Array<string>();
            emit("Vault reset successfully");
         } else {
            for (let i = 0; i < wallets.length; i++) {
                let wallet = Wallet.load(wallets[i]);
                if (!wallet) {
                    continue;
                }
                wallet.delete();
                let index = this.wallets.indexOf(wallets[i]);
                this.wallets.splice(index, 1);
            }
            emit("Wallets removed successfully");
        }

    }

    /**
     * list all the users in the wallet.
     */
    listUsers(user: string): void {
        let users: string = "";
        if (this.senderIsAdmin())
        {
            for (let i = 0; i < this.users.length; i++) {
                let userId = this.users[i];
                let userObj = User.load(userId);
                if (!userObj) {
                    revert(`User ${userId} does not exist`);
                    continue;
                }
                if (users.length > 0) {
                    users += ", ";
                }
                if (user.length == 0 || userObj.id.includes(user)) {
                    users += JSON.stringify<User>(userObj);
                }
            }
        }
        else {
            //return the users within the wallets the specified user is part of
            for (let i = 0; i < this.wallets.length; i++) {
                let walletId = this.wallets[i];
                let wallet = Wallet.load(walletId);
                if (!wallet) {
                    continue;
                }
                if (users.length > 0) {
                    users += ", ";
                }
                users += wallet.listUsers();
            }
        }
        if (users.length == 0) {
            emit(`No users found in the wallet`);
        }
        emit(`Users in the wallet: ${users}`);                
    }

    /**
     * Create a key with the given description and type.
     * @param description The description of the key.
     * @param type The type of the key.
     */
    addUserToWallet(walletId: string, userId: string, role: string): boolean {
        if (!this.senderIsRegistered())
        {
            revert("You are not allowed to add a wallet to this user");
            return false;
        }

        let wallet = Wallet.load(walletId);
        if (!wallet) {
            return false;
        }
        wallet.addUser(userId, role, false);
        return true;
    }

    /**
     * Remove a user from the wallet.
     * @param walletId The id of the wallet to use.
     * @param userId The id of the user to remove.
     */
    removeUserFromWallet(walletId: string, userId: string): boolean {
        if (!this.senderIsRegistered())
        {
            revert("You are not allowed to remove a wallet from this user");
            return false;
        }

        let wallet = Wallet.load(walletId);
        if (!wallet) {
            return false;
        }
        wallet.removeUser(userId, true);
        return true;
    }

    /**
     * Create a key in a defined wallet with the given description and type.
     * @param walletId The id of the wallet to use.
     * @param description The description of the key.
     * @param type The type of the key.
     */
    createKey(walletId: string, description: string, type: string): boolean {
        if (!this.senderIsRegistered())
        {
            revert("You are not allowed to add a key/access this wallet");
            return false;
        }

        let wallet = Wallet.load(walletId);
        if (!wallet) {
            return false;
        }
        wallet.createKey(description, type);
        return true;
    }

    /**
     * Remove a key from the wallet.
     * @param keyId The id of the key to remove.
     */
    deleteKey(walletId: string, keyId: string): boolean {
        if (!this.senderIsRegistered())
        {
            revert("You are not allowed to remove a key/access this wallet");
            return false;
        }
        let wallet = Wallet.load(walletId);
        if (!wallet) {
            return false;
        }
        wallet.deleteKey(keyId);
        wallet.save();
        return true;
    }

    /**
     * list all the keys in a wallet.
     * @param input containing the following fields:
     * - walletId: string, the wallet to list the keys for
     * - user: string, the user to list the keys for (optional)
     */
    listKeys(walletId: string, user: string): void {
        if (!this.senderIsRegistered())
        {
            revert("You are not allowed to list the keys in the wallet");
            return;
        }

        let wallet = Wallet.load(walletId);
        if (!wallet) {
            return;
        }
        wallet.listKeys(user);
    }

    /**
     * sign a message with the given key.
     * @param input containing the following fields:
     * - walletId: string, the wallet to use
     * - keyId: string, the key to sign with
     * - payload: string, the message to sign
     */
    sign(walletId: string, keyId: string, payload: string): string | null {
        if (!this.senderIsRegistered())
        {
            revert("You are not allowed to sign a message/access this wallet");
            return null;
        }

        let wallet = Wallet.load(walletId);
        if (!wallet) {
            return null;
        }
        return wallet.sign(keyId, payload);
    }

    /**
     * verify a signature with the given key.
     * @param input containing the following fields:
     * - walletId: string, the wallet to use
     * - keyId: string, the key to verify with
     * - payload: string, the message to verify
     */
    verify(walletId: string, keyId: string, payload: string, signature: string): boolean {
        if (!this.senderIsRegistered())
        {
            revert("You are not allowed to verify a signature/access this wallet");
            return false;
        }

        let wallet = Wallet.load(walletId);
        if (!wallet) {
            return false;
        }
        return wallet.verify(keyId, payload, signature);
    }

    /**
     * encrypt a message with the given key.
     */
    encrypt(walletId: string, keyId: string, message: string): string | null {
        if (!this.senderIsRegistered())
        {
            revert("You are not allowed to encrypt a message/access this wallet");
            return null;
        }
        let wallet = Wallet.load(walletId);
        if (!wallet) {
            return null;
        }
        return wallet.encrypt(keyId, message);
    }

    /**
     * encrypt a message with the given key.
     */
    decrypt(walletId: string, keyId:string, cypher: string): string | null{
        if (!this.senderIsRegistered())
        {
            revert("You are not allowed to encrypt a message/access this wallet");
            return null;
        }
        let wallet = Wallet.load(walletId);
        if (!wallet) {
            return null;
        }
        return wallet.decrypt(keyId, cypher);
    }

}