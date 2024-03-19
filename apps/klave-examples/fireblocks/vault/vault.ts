import { JSON, Ledger, Context } from "@klave/sdk";
import { Account } from "./account";
import { Policy } from "./policy";
import { Alias } from "./alias";
import { address, amount, emit } from "../../klave/types";
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
        this.policies = vault.policies;
        emit("Vault loaded successfully: " + vault_table);
    }

    save(): void {
        let vault_table = JSON.stringify<Vault>(this);
        Ledger.getTable(VaultTable).set("ALL", vault_table);
        emit("Vault saved successfully: " + vault_table);
    }

    findAccountIndex(id: string): i32 {
        for (let i = 0; i < this.accounts.length; i++) {
            if (this.accounts[i].id == id) {
                return i;
            }
        }
        return -1;
    }

    renameAccount(id: string, newName: string): void {
        let index = this.findAccountIndex(id);
        if (index == -1) {
            emit("Account not found");
            return;
        }
        this.accounts[index].rename(newName);
    }

    hideAccount(id: string): void {
        let index = this.findAccountIndex(id);
        if (index == -1) {
            emit("Account not found");
            return;
        }
        this.accounts[index].hide();
    }

    unhideAccount(id: string): void {
        let index = this.findAccountIndex(id);
        if (index == -1) {
            emit("Account not found");
            return;
        }
        this.accounts[index].unhide();
    }

    setCustomerRefId(id: string, customerRefId: string): void {
        let index = this.findAccountIndex(id);
        if (index == -1) {
            emit("Account not found");
            return;
        }
        this.accounts[index].setCustomerRefId(customerRefId);
    }

    setAutoFuel(id: string, autoFuel: boolean): void {
        let index = this.findAccountIndex(id);
        if (index == -1) {
            emit("Account not found");
            return;
        }
        this.accounts[index].setAutoFuel(autoFuel);
    }

    getAccounts(namePrefix: string, nameSuffix: string, minAmountThreshold: amount, assetId: string): Array<Account> {
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
        let account = new Account(Context.get(`sender`));        
        account.name = name;
        account.hiddenOnUI = hiddenOnUI;
        account.customerRefId = customerRefId;
        account.autoFuel = autoFuel;
        this.accounts.push(account);
        emit("Account created successfully");
    }

    bulkCreateAccounts(count: number, asset_ids: Array<string>): void {
        for (let i = 0; i < count; i++) {
            let account = new Account(`Account-${i}`);
            account.createWallet(asset_ids[i]);
            this.accounts.push(account);

        }
        emit("Accounts created successfully");
    }

    getMasterPublicKey(): string {
        return this.master_public_key.publicKey;
    }

    sign(accountId: string, assetId: string, payload: string) : void {
        let index = this.findAccountIndex(accountId);
        if (index == -1) {
            emit("Account not found");
            return;
        }
        this.accounts[index].sign(assetId, payload);
    }
}
