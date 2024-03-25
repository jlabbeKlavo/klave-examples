import { CreateWalletInput, SignInput, VerifyInput, AddUserInput, AddKeyInput, ListKeysInput, RemoveKeyInput, RemoveUserInput, CreateVaultInput, ListWalletsInput, ListUsersInput, AddUserToWalletInput, RemoveUserFromWalletInput, DeleteWalletInput, ApproveRequestInput, RequestAccessInput, RequestWalletCreationInput} from "./vault/inputs/types";
import { Vault } from "./vault/vault";
import { emit, revert } from "./klave/types";

/**
 * @transaction create a key in the given wallet
 * @param input containing the following fields:
 * - walletId: string
 * - description: string
 * - type: string
 * @returns success boolean
 */
export function createKey(input: AddKeyInput): void {
    let vault = Vault.load();
    if (!vault) {
        return;
    }
    if (vault.createKey(input.walletId, input.description, input.type)) {
        vault.save();
    }
}

/**
 * @transaction delete a key from the given wallet
 * @param input containing the following fields:
 * - walletId: string
 * - keyId: string
 * @returns success boolean
 */
export function deleteKey(input: RemoveKeyInput): void {
    let vault = Vault.load();
    if (!vault) {
        return;
    }
    if (vault.deleteKey(input.walletId, input.keyId)) {
        vault.save();
    }
}

/**
 * @query list all keys from the given wallet
 * @param input containing the following fields:
 * - walletId: string
 * - user: string, the user to list the keys for (optional)
 * @returns the list of keys
 */
export function listKeys(input: ListKeysInput): void {
    let vault = Vault.load();
    if (!vault) {
        return;
    }
    vault.listKeys(input.walletId, input.userId);
}

/**
 * @query list all wallets
 * @param input containing the following fields:
 * - userId: string, the user to list the wallets for (optional)
 * @returns the list of wallets
 */
export function listWallets(input: ListWalletsInput) : void {
    let vault = Vault.load();
    if (!vault) {
        return;
    }
    vault.listWallets(input.userId);
}

/**
 * @query list all users
 * @param input containing the following fields:
 * - walletId: string, the wallet to list the users for (optional)
 * @returns the list of users
 */
export function listUsers(input: ListUsersInput): void {
    let vault = Vault.load();
    if (!vault) {
        return;
    }
    vault.listUsers(input.walletId);
}

/**
 * @query
 * @param input containing the following fields:
 * - walletId: string
 * - keyId: string
 * - payload: string
 * @returns success boolean and the created text
 */
export function sign(input: SignInput) : void {
    let vault = Vault.load();
    if (!vault) {
        return;
    }
    let signature = vault.sign(input.walletId, input.keyId, input.payload);
    if (signature == null) {
        revert("Failed to sign");
        return;
    }
    emit(signature);
}

/**
 * @query 
 * @param input containing the following fields:
 * - walletId: string
 * - keyId: string
 * - payload: string
 * - signature: string
 * @returns success boolean
 */
export function verify(input: VerifyInput) : void {
    let vault = Vault.load();
    if (!vault) {
        return;
    }
    let result = vault.verify(input.walletId, input.keyId, input.payload, input.signature);
    if (!result) {
        revert(`Failed to verify`);
        return;
    }
    emit("verified");
}

/**
 * @query 
 * @param input containing the following fields:
 * - walletId: string
 * - keyId: string
 * - payload: string 
 * @returns success boolean and the crypted message
 */
export function encrypt(input: SignInput): void {
    let vault = Vault.load();
    if (!vault) {
        return;
    }
    let encrypted = vault.encrypt(input.walletId, input.keyId, input.payload);
    if (encrypted == null) {
        revert("Failed to encrypt");
        return;
    }
    emit(encrypted);    
}

/**
 * @query 
 * @param input containing the following fields:
 * - walletId: string
 * - keyId: string
 * - payload: string
 * @returns success boolean and text decyphered
 */
export function decrypt(input: SignInput): void {
    let vault = Vault.load();
    if (!vault) {
        return;
    }
    let decrypted = vault.decrypt(input.walletId, input.keyId, input.payload);
    if (decrypted == null) {
        revert("Failed to decrypt");
        return;
    }
    emit(decrypted);
}

/**
 * @transaction create a profile for vault access
 * @param input containing the following fields:
 * - userId: string
 * - role: string, "admin" or "user"
 * @returns success boolean
 */
export function createProfile(input: AddUserInput): void {
    let vault = Vault.load();
    if (!vault) {
        return;
    }
    if (vault.createProfile(input.userId, input.role, false)) {
        vault.save();
    }
}

/**
 * @transaction delete a profile from the vault
 * @param input containing the following fields:
 * - userId: string
 * @returns success boolean
 */
export function deleteProfile(input: RemoveUserInput): void {
    let vault = Vault.load();
    if (!vault) {
        return;
    }
    if (vault.deleteProfile(input.userId)) {
        vault.save();
    }
}

/**
 * @transaction request access to a specific wallet
 * @param input containing the following fields:
 * - walletId: string
 * - userId: string
 * - role: string, "admin", "internalUser" or  "externalUser"
 * @returns success boolean
 */
export function requestAccess(input: RequestAccessInput): void {
    let vault = Vault.load();
    if (!vault) {
        return;
    }
    if (vault.registerAccessRequest(input.walletId, input.userId, input.role)) {
        vault.save();
    }
}

/**
 * @transaction approve access to a specific wallet
 * @param input containing the following fields:
 * - requestId: string
 * @returns success boolean
 */
export function approveAccess(input: ApproveRequestInput): void {
    let vault = Vault.load();
    if (!vault) {
        return;
    }
    if (vault.approveAccessRequest(input.requestId)) {
        vault.save();
    }
}


/**
 * @transaction add a user to a wallet
 * @param input containing the following fields:
 * - walletId: string
 * - userId: string
 * - role: string, "admin" or "user"
 */
export function addUserToWallet(input: AddUserToWalletInput): void {
    let vault = Vault.load();
    if (!vault) {
        return;
    }
    if (vault.addUserToWallet(input.walletId, input.userId, input.role)) {
        vault.save();
    }
}

/**
 * @transaction delete a user from a wallet
 * @param input containing the following fields:
 * - userId: string
 * @returns success boolean
 */
export function removeUserFromWallet(input: RemoveUserFromWalletInput): void {
    let vault = Vault.load();
    if (!vault) {
        return;
    }
    if (vault.removeUserFromWallet(input.walletId, input.userId)) {
        vault.save();
    }
}

/**
 * @transaction initialize the wallet
 * @param input containing the following fields:
 * - name: string
 * @returns success boolean
 */
export function createWallet(input: CreateWalletInput): void {
    let vault = Vault.load();
    if (!vault) {        
        return;
    }    
    vault.createWallet(input.name);
    vault.save();
}

/**
 * @transaction delete the wallet
 * @param input containing the following fields:
 * - name: string
 * @returns success boolean
 */
export function deleteWallet(input: DeleteWalletInput): void {
    let vault = Vault.load();
    if (!vault) {        
        return;
    }    
    vault.deleteWallet(input.walletId);
    vault.save();
}

/**
 * @transaction request creation of a wallet
 * @param input containing the following fields:
 * - name: string
 * @returns success boolean
 */
export function requestWalletCreation(input: RequestWalletCreationInput): void {
    let vault = Vault.load();
    if (!vault) {        
        return;
    }    
    vault.registerWalletCreationRequest(input.walletName, input.userId, input.role);
    vault.save();
}

/**
 * @transaction approve creation of a wallet
 * @param input containing the following fields:
 * - requestId: string
 * @returns success boolean
 */
export function approveWalletCreation(input: ApproveRequestInput): void {
    let vault = Vault.load();
    if (!vault) {        
        return;
    }    
    vault.approveWalletCreationRequest(input.requestId);
    vault.save();
}

/**
 * @transaction intialize the vault
 * @param input containing the following fields:
 * - name: string
 * @returns success boolean
 */
export function createVault(input: CreateVaultInput): void {
    let existingWallet = Vault.load();
    if (existingWallet) {
        revert(`Wallet does already exists.`);        
        return;
    }
    Vault.create(input.name);
}