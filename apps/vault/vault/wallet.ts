import { Ledger, JSON, Context, Crypto } from "@klave/sdk";
import { emit, revert } from "../klave/types";
import { Key } from "./key";
import { User } from "./user";
import { encode as b64encode } from 'as-base64/assembly';
import { convertToUint8Array } from "../klave/helpers";



const WalletTable = "WalletTable";

/**
 * An Wallet is associated with a list of users and holds keys.
 */
@JSON
export class Wallet {    
    id: string;
    name: string;
    keys: Array<string>;
    users: Array<string>;

    constructor() {
        this.id = "";
        this.name = "";
        this.keys = new Array<string>();
        this.users = new Array<string>();
    }
    
    /**
     * load the wallet from the ledger.
     * @returns true if the wallet was loaded successfully, false otherwise.
     */
    static load(walletId: string): Wallet | null {
        let walletTable = Ledger.getTable(WalletTable).get(walletId);
        if (walletTable.length == 0) {
            revert("Wallet does not exists. Create it first");
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
    create(name: string): void {
        this.id = b64encode(convertToUint8Array(Crypto.getRandomValues(64)));
        this.name = name;
        this.addUser(Context.get('sender'), "admin", true);
        emit("Wallet created successfully: " + this.name);        
        return;
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
    delete(): void {
        if (!this.senderIsAdmin())
        {
            revert("You are not allowed to delete the wallet");
            return;
        }
        this.name = "";
        this.keys = new Array<string>();
        this.users = new Array<string>();
        Ledger.getTable(WalletTable).unset(this.id);
        emit("Wallet deleted successfully");
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

        let existingUser = User.load(userId);
        if (!existingUser) {
            revert(`User ${userId} does not have a profile yet. Create it.`);
            return false;
        }
        existingUser.addWallet(this.id, role);
        existingUser.save();
        this.users.push(userId);
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
            let user = User.load(userId);
            if (!user) {
                revert("User not found: " + userId);
                return false;
            }
            user.removeWallet(this.id);
            user.save();
        }
        
        let index = this.users.indexOf(userId);
        this.users.splice(index, 1);
        emit("User removed successfully: " + userId);
        return true;
    }

    /**
     * List all the users in the wallet.
     */
    listUsers(): string {
        if (!this.senderIsRegistered())
        {
            revert("You are not allowed to list the users in the wallet");
            return "";
        }

        let users: string = "";
        for (let i = 0; i < this.users.length; i++) {
            let user = User.load(this.users[i]);
            if (!user) {
                revert(`User ${this.users[i]} does not exist`);
                continue;
            }
            if (users.length > 0) {
                users += ", ";
            }
            users += JSON.stringify<User>(user);
        }
        return users;
    }

    /**
     * Check if the sender is an admin.
     * @returns True if the sender is an admin, false otherwise.
     */
    senderIsAdmin(): boolean {
        let user = User.loadWallet(Context.get('sender'), this.id);
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
        let user = User.loadWallet(Context.get('sender'), this.id);
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
        let user = User.loadWallet(userId, this.id);
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
        let user = User.loadWallet(userId, this.id);
        if (!user) {
            return false;
        }
        return true;
    }

    /**
     * list all the keys in the wallet.
     * @returns 
     */
    listKeys(user: string): void {
        if (!this.senderIsRegistered())
        {
            revert("You are not allowed to list the keys in the wallet");
            return;
        }        

        let keys: string = "";
        for (let i = 0; i < this.keys.length; i++) {
            let key = this.keys[i];
            let keyObj = Key.load(key);
            if (!keyObj) {
                revert(`Key ${key} does not exist`);
                continue;
            }            
            if (keys.length > 0) {
                keys += ", ";
            }
            if (user.length == 0 || keyObj.owner == user) {
                keys += JSON.stringify<Key>(keyObj);
            }
        }
        if (keys.length == 0) {
            emit(`No keys found in the wallet`);
        }
        emit(`Keys in the wallet: ${keys}`);
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
            this.keys = new Array<string>();
            this.users = new Array<string>();
            emit("Wallet reset successfully");
         } else {
            for (let i = 0; i < keys.length; i++) {
                let key = new Key(keys[i]);                
                key.delete();
                let index = this.keys.indexOf(keys[i]);
                this.keys.splice(index, 1);
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
        if (!this.senderIsRegistered())
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
        if (!this.senderIsRegistered())
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
        if (!this.senderIsRegistered())
        {
            revert("You are not allowed to add a key/access this wallet");
            return false;
        }
        let key = new Key("");
        key.create(description, type);
        key.save();

        this.keys.push(key.id);
        return true;
    }

    /**
     * Remove a key from the wallet.
     * @param keyId The id of the key to remove.
     */
    deleteKey(keyId: string): boolean {
        if (!this.senderIsRegistered())
        {
            revert("You are not allowed to remove a key/access this wallet");
            return false;
        }
        let key = Key.load(keyId);
        if (!key) {
            return false;
        }
        key.delete();

        let index = this.keys.indexOf(keyId);
        this.keys.splice(index, 1);
        return true;
    }

    /**
     * encrypt a message with the given key.
     */
    encrypt(keyId: string, message: string): string | null {
        if (!this.senderIsRegistered())
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
        if (!this.senderIsRegistered())
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

}