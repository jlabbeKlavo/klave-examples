import { Ledger, JSON, Context, Crypto } from "@klave/sdk";
import { emit, revert } from "../klave/types";
import { ChainedKeys, Key } from "./key";
import { VaultUser } from "./vaultUser";
import { encode as b64encode } from 'as-base64/assembly';
import { convertToUint8Array } from "../klave/helpers";
import { ChainedIDs, ChainedItems } from "../klave/chained";

const WalletTable = "WalletTable";

/**
 * An Wallet is associated with a list of users and holds keys.
 */
@JSON
export class Wallet {    
    id: string;
    name: string;
    keys: ChainedKeys;
    users: ChainedIDs;

    constructor() {
        this.id = "";
        this.name = "";
        this.keys = new ChainedKeys();
        this.users = new ChainedIDs();
    }
    
    /**
     * load the wallet from the ledger.
     * @returns true if the wallet was loaded successfully, false otherwise.
     */
    static load(walletId: string): Wallet | null {
        let walletTable = Ledger.getTable(WalletTable).get(walletId);
        if (walletTable.length == 0) {
            revert("Wallet does not exist. Create it first");
            return null;
        }
        let wlt = JSON.parse<Wallet>(walletTable);
        emit("Wallet loaded successfully: " + walletTable);
        return wlt;
    }
 
    /**
     * save the wallet to the ledger.
     */
    save(): void {
        let walletTable = JSON.stringify<Wallet>(this);
        Ledger.getTable(WalletTable).set(this.id, walletTable);
        emit("Wallet saved successfully: " + walletTable);
    }

    /**
     * Create a wallet with the given name.
     * Also adds the sender as an admin user.
     * @param name 
     */
    static create(name: string): Wallet {
        let wallet = new Wallet();
        wallet.id = b64encode(convertToUint8Array(Crypto.getRandomValues(64)));
        wallet.name = name;
        wallet.addUser(Context.get('sender'), "admin", true);
        wallet.save();
        emit("Wallet created successfully: " + wallet.name);
        return wallet;
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
            revert("Wallet name does not match");
            return;
        }
        this.name = newName;
        emit("Wallet renamed successfully");
    }

    /**
     * delete the wallet.     
     */
    static delete(walletId: string): void {
        let wallet = Wallet.load(walletId);
        if (!wallet) {
            return;
        }        
        wallet.keys.reset();
        wallet.users.reset();
        Ledger.getTable(WalletTable).unset(walletId);
        emit(`Wallet deleted successfully: '${walletId}'`);
    }

    
    /**
     * Add a user to the wallet.
     * @param userId The id of the user to add.
     * @param role The role of the user to add.
     */
    addUser(userId: string, role: string, force: boolean): boolean {
        if (!force && !this.senderIsAdmin())
        {
            revert(`You are not allowed to add a user`);
            return false;
        }

        let existingUser = VaultUser.load(userId);
        if (!existingUser) {
            revert(`User ${userId} does not have a profile yet. Create it.`);
            return false;
        }
        existingUser.addWallet(this.id, role);
        existingUser.save();

        this.users.add(userId);
        emit("User added successfully: " + userId);
        return true;
    }

    /**
     * Remove a user from the wallet.
     * @param userId The id of the user to remove.
     */
    removeUser(userId: string, removeFromUser: boolean): boolean {
        if (!this.senderIsAdmin())
        {
            revert("You are not allowed to remove a user");
            return false;
        }

        if (removeFromUser) {
            let user = VaultUser.load(userId);
            if (!user) {
                revert("User not found: " + userId);
                return false;
            }
            user.removeWallet(this.id);
            user.save();
        }
        
        this.users.remove(userId);

        emit("User removed successfully: " + userId);
        return true;
    }

    /**
     * List all the users in the wallet.
     */
    listUsers(): string {
        if (!this.senderIsAdmin())
        {
            revert("You are not allowed to list the users in the wallet");
            return "";
        }

        let users = this.users.getAllAsString();
        if (users.length == 0) {
            emit(`No users found in the wallet`);
        }
        emit(`Users in the wallet: ${users}`);
        return users;
    }

    /**
     * Check if the sender is an admin.
     * @returns True if the sender is an admin, false otherwise.
     */
    senderIsAdmin(): boolean {
        let user = VaultUser.load(Context.get('sender'));
        if (!user) {
            return false;
        }
        let index = user.findWalletIndex(this.id);
        if (index == -1) {
            return false;
        }

        return user.role == "admin";
    }

    /**
     * Check if the sender is an admin.
     * @returns True if the sender is an admin, false otherwise.
     */
    senderIsInternalUser(): boolean {
        let user = VaultUser.load(Context.get('sender'));
        if (!user) {
            return false;
        }
        let index = user.findWalletIndex(this.id);
        if (index == -1) {
            return false;
        }
        return (user.role == "admin" || user.role == "internalUser");
    }

    /**
     * Check if the sender is registered.
     * @returns True if the sender is registered, false otherwise.
     */
    senderIsExternalUser(): boolean {
        let user = VaultUser.load(Context.get('sender'));
        if (!user) {
            return false;
        }
        return true;
    }

    /**
     * Check if a given user is an admin.
     * @returns True if the user is an admin, false otherwise.
     */
    userIsAdmin(userId: string): boolean {
        let user = VaultUser.load(userId);
        if (!user) {
            return false;
        }
        return user.role == "admin";
    }

    /**
     * Check if a given user is registered.
     * @returns True if the user is registered, false otherwise.
     */
    userIsRegistered(userId: string): boolean {
        let user = VaultUser.load(userId);
        if (!user) {
            return false;
        }
        return true;
    }

    /**
     * list all the keys in the wallet.
     * @returns 
     */
    listKeys(user: string): string {
        if (!this.senderIsInternalUser())
        {
            revert("You are not allowed to list the keys in the wallet");
            return "";
        }        

        let keys = this.keys.getAllAsString();
        if (keys.length == 0) {
            emit(`No keys found in the wallet`);
        }
        emit(`Keys in the wallet: ${keys}`);       
        return keys; 
    }

    /**
     * reset the wallet to its initial state.
     * @returns 
     */
    reset(keys: Array<string>): void {
        if (!this.senderIsAdmin())
        {
            revert("You are not allowed to reset the wallet");
            return;
        }

        if (keys.length == 0) {
            this.name = "";        
            this.keys.reset();
            this.users.reset();
            emit("Wallet reset successfully");
         } else {
            let allKeys = this.keys.getAll();    
            // for each key in the list, remove it from the wallet
            for (let j = 0; j < keys.length; j++) {
                for (let i = 0; i < allKeys.length; i++) {
                    let key = allKeys[i];
                    if (key.id == keys[j]) {
                        Key.delete(key.id);
                        this.keys.removeIndex(i);
                        break;
                    }
                }
            }
            emit("Keys removed successfully");
        }
    }

    /**
     * Sign a message with the given key.
     * @param keyId The id of the key to sign with.
     * @param payload The message to sign.
     */
    sign(keyId: string, payload: string): string | null {
        if (!this.senderIsExternalUser())
        {
            revert("You are not allowed to sign a message/access this wallet");
            return null;
        }
        let key = Key.load(keyId);
        if (!key) {
            return null;
        }
        return key.sign(payload);        
    }

    /**
     * Verify a signature with the given key.
     * @param keyId The id of the key to verify with.
     * @param payload The message to verify.
     * @param signature The signature to verify.
     */
    verify(keyId: string, payload: string, signature: string): boolean {
        if (!this.senderIsExternalUser())
        {
            revert("You are not allowed to verify a signature/access this wallet");
            return false;
        }
        let key = Key.load(keyId);
        if (!key) {
            return false;
        }
        return key.verify(payload, signature);        
    }

    /**
     * Create a key with the given description and type.
     * @param description The description of the key.
     * @param type The type of the key.
     */
    createKey(description: string, type: string): boolean {
        if (!this.senderIsInternalUser())
        {
            revert("You are not allowed to add a key/access this wallet");
            return false;
        }
        let key = Key.create(description, type);        
        if (!key) {
            revert("Failed to create key");
            return false;
        }
        this.keys.add(key);
        return true;
    }

    /**
     * Remove a key from the wallet.
     * @param keyId The id of the key to remove.
     */
    deleteKey(keyId: string): boolean {
        if (!this.senderIsInternalUser())
        {
            revert("You are not allowed to remove a key/access this wallet");
            return false;
        }
        Key.delete(keyId);
        this.keys.remove(keyId);
        return true;
    }

    /**
     * encrypt a message with the given key.
     */
    encrypt(keyId: string, message: string): string | null {
        if (!this.senderIsExternalUser())
        {
            revert("You are not allowed to encrypt a message/access this wallet");
            return null;
        }
        let key = Key.load(keyId);
        if (!key) {
            return null;
        }
        return key.encrypt(message);        
    }

    /**
     * encrypt a message with the given key.
     */
    decrypt(keyId:string, cypher: string): string | null{
        if (!this.senderIsExternalUser())
        {
            revert("You are not allowed to encrypt a message/access this wallet");
            return null;
        }
        let key = Key.load(keyId);
        if (!key) {
            return null;
        }
        return key.decrypt(cypher);        
    }

    /**
     * return the wallet info.     
     */
    getInfo(): string {
        return `{"id":"${this.id}","name":"${this.name}"}`;
    }
}

export class ChainedWallets extends ChainedItems<Wallet> {
    constructor() {
        super();
    }        

    includes(id: string): boolean {
        let all = this.getAll();
        for (let i = 0; i < all.length; i++) {            
            let item = all[i];
            if (item.id == id) {
                return true;
            }
        }
        return false;
    }

    remove(walletId: string): void {
        let all = this.getAll();
        for (let i = 0; i < all.length; i++) {
            let item = all[i];
            if (item.id == walletId) {
                this.removeIndex(i);
                break;
            }
        }
    }

    add(wallet: Wallet) : void {
        this.add_with_id(wallet, wallet.id);
    }

    getInfo(): string {
        let str = "";
        let all = this.getAll();
        for (let i = 0; i < all.length; i++) {            
            let item = all[i];
            if (str.length > 0) {
                str += ", ";
            }            
            if (item) {
                str += `{"id":"${item.id}","name":"${item.name}"}`;
            }
        }
        str = `[${str}]`;
        return str;
    }        
}