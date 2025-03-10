import { Ledger, JSON, Context } from "@klave/sdk";
import { emit, revert } from "../klave/types";
import { ChainedWallets, Wallet } from "./wallet";
import { ChainedVaultUsers, VaultUser } from "./vaultUser";
import { AccessRequest, ChainedAccessRequests } from "./requests/accessRequests";
import { CreateRequest, ChainedCreateRequests } from "./requests/createRequests";
import { Recovery } from "./recovery";

const VaultTable = "VaultTable";

/**
 * An Vault is associated with a list of users and holds keys.
 */
@JSON
export class Vault {
    name: string;
    wallets: ChainedWallets;
    users: ChainedVaultUsers;
    accessRequests: ChainedAccessRequests;
    createRequests: ChainedCreateRequests;
    recoveryPolicy: Recovery;

    constructor() {
        this.name = "";
        this.wallets = new ChainedWallets();
        this.users = new ChainedVaultUsers();
        this.accessRequests = new ChainedAccessRequests();
        this.createRequests = new ChainedCreateRequests();
        this.recoveryPolicy = new Recovery();
    }

    /**
     * load the wallet from the ledger.
     * @returns true if the wallet was loaded successfully, false otherwise.
     */
    static load(): Vault | null {
        let vaultTable = Ledger.getTable(VaultTable).get("ALL");
        if (vaultTable.length == 0) {
            revert("Vault does not exist. Create it first");
            return null;
        }
        let vault = JSON.parse<Vault>(vaultTable);
        emit("Vault loaded successfully: " + JSON.stringify(vault));
        return vault;
    }

    /**
     * save the wallet to the ledger.
     */
    save(): void {
        let vaultTable = JSON.stringify<Vault>(this);
        Ledger.getTable(VaultTable).set("ALL", vaultTable);
        emit("Vault saved successfully: " + JSON.stringify(this));
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
    static create(name: string): void {
        let vault = Vault.load();
        if (vault) {
            revert("Vault already exists");
            return;
        }
        vault = new Vault();
        vault.name = name;
        vault.createProfile(Context.get('sender'), "admin", "", true);
        vault.recoveryPolicy.createDefault();
        vault.save();
        emit("Vault created successfully: " + vault.name);
        return;
    }

    /**
     * Create a profile for vault access.
     * An admin can actually add a profile with a specific role.
     * An unregistered user can only add a profile with the role "external user".
     * @param userId The id of the user to add.
     * @param role The role of the user to add.
     */
    createProfile(userId: string, role: string, publicKey: string, force: boolean): boolean {
        if (!force && !this.senderIsAdmin())
        {
            revert("You are not allowed to create a profile with a specific role");
            role = "external user";
            userId = Context.get('sender');
        }

        let existingUser = VaultUser.load(userId);
        if (existingUser) {
            revert("User already exists: " + userId);
            return false;
        }
        let user = VaultUser.create(role, publicKey);
        this.users.add(user);
        emit("User added successfully: " + user.id);
        return true;
    }

    /**
     * Remove a user from the vault.
     * @param userId The id of the user to remove.
     */
    deleteProfile(userId: string): boolean {
        if (!this.senderIsAdmin() && userId != Context.get('sender'))
        {
            revert("You are not allowed to remove a user");
            return false;
        }
        VaultUser.delete(userId);
        this.users.remove(userId);
        emit("User removed successfully: " + userId);
        return true;
    }

    /**
     * Create a recovery key for the vault.
     */
    createRecoveryKey(): void {
        if (!this.senderIsAdmin())
        {
            revert("You are not allowed to create a recovery key");
            return;
        }
        let key = Crypto.AES.generateKey("recovery");
        let wallet = Wallet.load("recovery");
        if (!wallet) {
            wallet = Wallet.create("recovery");
            this.wallets.add(wallet);
        }
        wallet.createKey("recovery", "AES");
        wallet.save();
        emit("Recovery key created successfully");
    }

    /**
     * Register an access request for a user to a wallet.
     */
    registerAccessRequest(walletId: string, userId: string, role: string): boolean {
        if (this.senderIsAdmin())
        {
            revert("You do not need to register an access request");
            return false;
        }

        let wallet = Wallet.load(walletId);
        if (!wallet) {
            return false;
        }
        if (wallet.senderIsAdmin()) {
            revert("You do not need to register an access request for this wallet");
        }

        if (!this.createProfile(userId, role, "", false)) {
            return false;
        }

        let accessRequest = AccessRequest.create(walletId, userId, role);
        this.accessRequests.add(accessRequest);
        emit("Access request created successfully: " + accessRequest.id);
        return true;
    }

    /**
     * Approve an access request for a user to a wallet.
     */
    approveAccessRequest(requestId: string): boolean {
        let accessRequest = AccessRequest.load(requestId);
        if (!accessRequest) {
            return false;
        }
        let wallet = Wallet.load(accessRequest.walletId);
        if (!wallet) {
            return false;
        }
        if (!wallet.senderIsAdmin()) {
            revert("You are not allowed to approve an access request");
            return false;
        }
        wallet.addUser(accessRequest.userId, accessRequest.role, true);
        wallet.save();
        this.accessRequests.remove(requestId);
        emit("Access request approved successfully: " + requestId);
        return true;
    }

    /**
     * Register a wallet creation request.
     */
    registerWalletCreationRequest(walletName: string, userId: string, role: string): boolean {
        if (this.senderIsAdmin())
        {
            revert("You do not need to register an access request");
            return false;
        }

        if (!this.createProfile(userId, role, "", false)) {
            return false;
        }

        let createRequest = CreateRequest.create(walletName, userId, role);
        this.createRequests.add(createRequest);
        emit("Wallet creation request created successfully: " + createRequest.id);
        return true;
    }

    /**
     * Approve an access request for a user to a wallet.
     */
    approveWalletCreationRequest(requestId: string): boolean {
        let createRequest = CreateRequest.load(requestId);
        if (!createRequest) {
            return false;
        }
        if (!this.senderIsAdmin()) {
            revert("You are not allowed to approve a create request");
            return false;
        }
        let wallet = Wallet.create(createRequest.walletName);
        if (!wallet) {
            return false;
        }
        wallet.addUser(createRequest.userId, createRequest.role, true);
        wallet.save();
        this.createRequests.remove(requestId);
        emit("Create request approved successfully: " + requestId);
        return true;
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
        return user.role == "admin";
    }

    /**
     * Check if the sender is registered.
     * @returns True if the sender is registered, false otherwise.
     */
    senderIsRegistered(): boolean {
        let user = VaultUser.load(Context.get('sender'));
        if (!user) {
            return false;
        }
        return true;
    }

    /**
     * create a wallet with the given name.
     */
    createWallet(walletName: string): void {
        if (!this.senderIsRegistered())
        {
            revert("You are not allowed to create a wallet");
            return;
        }

        let wallet = Wallet.load(walletName);
        if (wallet) {
            revert(`Wallet ${walletName} already exists`);
            return;
        }
        wallet = Wallet.create(walletName);
        this.wallets.add(wallet);
        emit("Wallet created successfully: " + wallet.id);
    }

    /**
     * delete a wallet with the given id.
     */
    deleteWallet(walletId: string): void {
        if (!this.senderIsRegistered())
        {
            revert("You are not allowed to delete a wallet");
            return;
        }

        Wallet.delete(walletId);
        this.wallets.remove(walletId);
        emit("Wallet deleted successfully: " + walletId);
    }

    /**
     * list all the wallets in the vault.
     * @returns
     */
    listWallets(userId: string): void {
        let walletsStr: string = "";
        if (this.senderIsAdmin())
        {
            if (this.wallets.size == 0) {
                emit(`No wallets found in the vault`);
            }
            if (userId.length == 0) {
                walletsStr = this.wallets.getInfo();
            }
            else {
                let user = VaultUser.load(userId);
                if (!user) {
                    revert(`User ${userId} does not exist`);
                    return;
                }
                let allUserWallets = user.wallets.getAll();
                for (let i = 0; i < allUserWallets.length; i++) {
                    let userWallet = allUserWallets[i];
                    let walletObj = Wallet.load(userWallet.id);
                    if (!walletObj) {
                        revert(`Wallet ${userWallet.id} does not exist`);
                        continue;
                    }
                    if (walletsStr.length > 0) {
                        walletsStr += ", ";
                    }
                    walletsStr += walletObj.getInfo();
                }
            }
        }
        else {
            if (userId.length == 0) {
                emit(`No privileges were found for ${userId} to display wallets in this vault`);
                return;
            }
            let user = VaultUser.load(userId);
            if (!user) {
                return;
            }
            walletsStr += user.wallets.getInfo();
        }
        if (walletsStr.length == 0) {
            emit(`No wallets found in the vault`);
        }
        emit(`Wallets in the vault: ${walletsStr}`);
    }

    /**
     * reset the vault to its initial state.
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
            this.wallets = new ChainedWallets();
            this.users = new ChainedVaultUsers();
            emit("Vault reset successfully");
         } else {
            let allWallets = this.wallets.getAll();
            for (let i = 0; i < allWallets.length; i++) {
                let wallet = allWallets[i];
                if (wallets.includes(wallet.id)) {
                    Wallet.delete(wallet.id);
                    this.wallets.remove(wallet.id);
                }
            }
            emit("Wallets removed successfully");
        }

    }

    /**
     * list all the users in the vault.
     */
    listUsers(walletId: string): void {
        let users: string = "";
        if (this.senderIsAdmin() && walletId.length == 0)
        {
            if (this.users.size == 0) {
                emit(`No users found in the vault`);
            }
            else {
                users = this.users.getInfo();
            }
        }
        else {
            let wallet = Wallet.load(walletId);
            if (!wallet) {
                return;
            }
            if (wallet.senderIsAdmin()) {
                users = wallet.listUsers();
            }
        }
        if (users.length == 0) {
            emit(`No users found in the vault`);
        }
        emit(`Users in the vault: ${users}`);
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
        wallet.save();
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
        wallet.save();
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
        wallet.save();
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