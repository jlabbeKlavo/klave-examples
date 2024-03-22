import { RenameWalletInput, CreateWalletInput, SignInput, VerifyInput, AddUserInput, AddKeyInput, ListKeysInput, ResetInput, RemoveKeyInput, RemoveUserInput, CreateVaultInput} from "./vault/inputs/types";
import { Vault } from "./vault/vault";
import { emit, revert } from "./klave/types";

/**
 * @transaction add a key to the wallet
 * @param input containing the following fields:
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
 * @transaction remove a key from the wallet
 * @param input containing the following fields:
 * - keyId: string
 * @returns success boolean
 */
export function removeKey(input: RemoveKeyInput): void {
    let vault = Vault.load();
    if (!vault) {
        return;
    }
    if (vault.removeKey(input.walletId, input.keyId)) {
        vault.save();
    }
}

/**
 * @query list all keys in the wallet
 * @param input containing the following fields:
 * - user: string, the user to list the keys for (optional)
 * @returns the list of keys
 */
export function listKeys(input: ListKeysInput): void {
    let vault = Vault.load();
    if (!vault) {
        return;
    }
    vault.listKeys(input.walletId, input.user);
}

/**
 * @query
 * @param input containing the following fields:
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
 * @transaction add a user to the wallet
 * @param input containing the following fields:
 * - userId: string
 * - role: string, "admin" or "user"
 * @returns success boolean
 */
export function addUser(input: AddUserInput): void {
    let vault = Vault.load();
    if (!vault) {
        return;
    }
    if (vault.addUser(input.userId, input.role, false)) {
        vault.save();
    }
}

/**
 * @transaction remove a user from the wallet
 * @param input containing the following fields:
 * - userId: string
 * @returns success boolean
 */
export function removeUser(input: RemoveUserInput): void {
    let vault = Vault.load();
    if (!vault) {
        return;
    }
    if (vault.removeUser(input.userId)) {
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
    let vault = new Vault();
    vault.create(input.name);
    vault.save();
}