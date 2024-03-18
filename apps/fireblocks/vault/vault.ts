import { JSON, Ledger, Context } from "@klave/sdk";
import { AccountsInput, RenameAccountInput, CreateAccountInput, HideAccountInput, UnhideAccountInput, SetCustomerRefIdInput, SetAutoFuelInput, BulkCreateAccountInput } from "./inputs/types";
import { Account } from "./account";
import { Asset } from "./asset";
import { Policy } from "./policy";
import { Alias } from "./alias";
import { address, emit } from "../../klave/types";
import { PublicKeyInfo } from "./publicKey";

const VaultTable = "VaultTable";

/**
 * Secure place where private keys are stored.
 * It's like a bank vault where valuables are stored, but for digital assets.
 */
@JSON
export class Vault {    
    accounts: Array<Account>;
    master_public_key: PublicKeyInfo;
    owner: address;
    aliases: Array<Alias>;
    policies: Array<Policy>;

    constructor() {
        this.accounts = new Array<Account>();
        this.master_public_key = new PublicKeyInfo();
        this.owner = Context.get(`sender`);
        this.aliases = new Array<Alias>();
        this.policies = new Array<Policy>();
    }

    load(): void {
        let vault_table = Ledger.getTable(VaultTable).get("ALL");
        if (vault_table.length == 0) {
            emit("Vault does not exists. Create it first");
            return;
        }
        let vault = JSON.parse<Vault>(vault_table);
        this.accounts = vault.accounts;
        this.master_public_key = vault.master_public_key;
        this.owner = vault.owner;
        this.aliases = vault.aliases;
        emit("Vault loaded successfully: " + vault_table);
    }

    save(): void {
        let vault_table = JSON.stringify<Vault>(this);
        Ledger.getTable(VaultTable).set("ALL", vault_table);
        emit("Vault saved successfully: " + vault_table);
    }

    renameAccount(id: string, newName: string): void {
        for (let i = 0; i < this.accounts.length; i++) {
            if (this.accounts[i].id == id) {
                this.accounts[i].rename(newName);
                break;
            }
        }
    }

    hideAccount(id: string): void {
        for (let i = 0; i < this.accounts.length; i++) {
            if (this.accounts[i].id == id) {
                this.accounts[i].hide();
                break;
            }
        }
    }

    unhideAccount(id: string): void {
        for (let i = 0; i < this.accounts.length; i++) {
            if (this.accounts[i].id == id) {
                this.accounts[i].unhide();
                break;
            }
        }
    }

    setCustomerRefId(id: string, customerRefId: string): void {
        for (let i = 0; i < this.accounts.length; i++) {
            if (this.accounts[i].id == id) {
                this.accounts[i].setCustomerRefId(customerRefId);
                break;
            }
        }
    }

    setAutoFuel(id: string, autoFuel: boolean): void {
        for (let i = 0; i < this.accounts.length; i++) {
            if (this.accounts[i].id == id) {
                this.accounts[i].setAutoFuel(autoFuel);
                break;
            }
        }
    }

    getAccounts(namePrefix: string, nameSuffix: string, minAmountThreshold: number, assetId: string): Array<Account> {
        let result = new Array<Account>();
        for (let i = 0; i < this.accounts.length; i++) {
            let account = this.accounts[i];
            if (account.name.startsWith(namePrefix) && account.name.endsWith(nameSuffix)) {
                for (let j = 0; j < account.assets.length; j++) {
                    let asset = account.assets[j];
                    if (asset.balance > minAmountThreshold && asset.id == assetId) {
                        result.push(account);
                        break;
                    }
                }
            }
        }
        return result;
    }

    createAccount(name: string, hiddenOnUI: boolean, customerRefId: string, autoFuel: boolean): void {
        for (let i = 0; i < this.accounts.length; i++) {
            let account = this.accounts[i];
            if (account.name == name) {
                emit("Account already exists");
                return;
            }
        }
        let account = new Account();
        account.id = Context.get(`sender`);
        account.name = name;
        account.hiddenOnUI = hiddenOnUI;
        account.customerRefId = customerRefId;
        account.autoFuel = autoFuel;
        this.accounts.push(account);
        emit("Account created successfully");
    }

    bulkCreateAccounts(count: number, asset_ids: Array<string>): void {
        for (let i = 0; i < count; i++) {
            let account = new Account();
            account.id = Context.get(`sender`);
            account.name = `Account-${i}`;
            account.hiddenOnUI = false;
            account.customerRefId = "";
            account.autoFuel = false;
            for (let j = 0; j < asset_ids.length; j++) {
                let asset = new Asset();
                asset.id = asset_ids[j];
                asset.balance = 0;
                account.assets.push(asset);
            }
            this.accounts.push(account);
        }
        emit("Accounts created successfully");
    }

    getMasterPublicKey(): string {
        return this.master_public_key.publicKey;
    }
}



/**
 * @query retrieve the accounts from the vault that match the input criteria
 * @param input containing the following fields:
 * - namePrefix: string
 * - nameSuffix: string
 * - minAmountThreshold: amount
 * - assetId: string
 * - limit: number
 */

export function accounts(input: AccountsInput): void {
    let vault = new Vault();
    vault.load();    
    let result = new Array<Account>();
    for (let i = 0; i < vault.accounts.length; i++) {
        let account = accounts[i];
        if (account.name.startsWith(input.namePrefix) && account.name.endsWith(input.nameSuffix)) {
            for (let j = 0; j < account.assets.length; j++) {
                let asset = account.assets[j];
                if (asset.balance > input.minAmountThreshold && asset.id == input.assetId) {
                    result.push(account);
                    break;
                }
            }
        }
    }
    emit(JSON.stringify(result));   
}

/**
 * @transaction create an account in the vault
 * @param input containing the following fields:
 * - name: string
 * - hiddenOnUI: boolean
 * - customerRefId: string
 * - autoFuel: boolean
 */
export function createAccount(input: CreateAccountInput): void {
    let vault = new Vault();
    vault.load();
    for (let i = 0; i < vault.accounts.length; i++) {
        let account = accounts[i];
        if (account.name == input.name) {
            emit("Account already exists");
            return;
        }
    }
    let account = new Account();
    account.id = Context.get(`sender`);
    account.name = input.name;
    account.hiddenOnUI = input.hiddenOnUI;
    account.customerRefId = input.customerRefId;
    account.autoFuel = input.autoFuel;
    vault.accounts.push(account);
    vault.save();
    emit("Account created successfully");
}

/**
 * @transaction reset the vault
 */
export function reset(): void {
    let vault_table = Ledger.getTable(VaultTable).get("ALL");
    if (vault_table.length == 0) {
        emit("Vault is already empty");
        return;
    }
    let vault = new Vault();
    vault.accounts = new Array<Account>();
    vault.save();
    emit("Vault reset successfully");
}

/**
 * @transaction bulk create accounts in the vault
 * @param input containing the following fields:
 * - count: number
 * - asset_ids: Array<string>
 */
export function bulkCreateAccount(input: BulkCreateAccountInput): void {
    let vault = new Vault();
    vault.load();
    for (let i = 0; i < input.count; i++) {
        let account = new Account();
        account.id = Context.get(`sender`);
        account.name = `Account-${i}`;
        account.hiddenOnUI = false;
        account.customerRefId = "";
        account.autoFuel = false;
        for (let j = 0; j < input.asset_ids.length; j++) {
            let asset = new Asset();
            asset.id = input.asset_ids[j];
            asset.balance = 0;
            account.assets.push(asset);
        }
        vault.accounts.push(account);
    }
    vault.save();
    emit("Accounts created successfully");
}