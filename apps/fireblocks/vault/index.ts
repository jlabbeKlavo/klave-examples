import { JSON, Ledger, Context } from "@klave/sdk";
import { AccountsInput, RenameAccountInput, CreateAccountInput, HideAccountInput, UnhideAccountInput, SetCustomerRefIdInput, SetAutoFuelInput, BulkCreateAccountInput } from "./inputs/types";
import { Account } from "./account";
import { Asset } from "./asset";
import { Vault } from "./vault";
import { emit } from "../../klave/types";

const VaultTable = "VaultTable";

/**
 * @transaction rename an account in the vault
 * @param oldName: string
 * @param newName: string
 */
export function renameAccount(input: RenameAccountInput): void {
    let vault = new Vault();
    vault.load();
    vault.renameAccount(input.id, input.newName);
    vault.save();
}

/**
 * @transaction hide an account in the vault
 * @param id: string
 */
export function hideAccount(input: HideAccountInput): void {
    let vault = new Vault();
    vault.load();
    vault.hideAccount(input.id);
    vault.save();
}

/**
 * @transaction unhide an account in the vault
 * @param id: string
 */
export function unhideAccount(input: UnhideAccountInput): void {
    let vault = new Vault();
    vault.load();    
    vault.unhideAccount(input.id);
    vault.save();
}

/**
 * @transaction set the customer reference id for an account in the vault
 * @param id: string
 * @param customerRefId: string
 */
export function setCustomerRefId(input: SetCustomerRefIdInput): void {
    let vault = new Vault();
    vault.load();    
    vault.setCustomerRefId(input.id, input.customerRefId);
    vault.save();
}

/**
 * @transaction set the auto fuel flag for an account in the vault
 * @param id: string
 * @param autoFuel: boolean
 */
export function setAutoFuel(input: SetAutoFuelInput): void {
    let vault = new Vault();
    vault.load();
    vault.setAutoFuel(input.id, input.autoFuel);
    vault.save();
}

/**
 * @query 
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
    let result = vault.getAccounts(input.namePrefix, input.nameSuffix, input.minAmountThreshold, input.assetId);
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
    vault.createAccount(input.name, input.hiddenOnUI, input.customerRefId, input.autoFuel);
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
 * @transaction bulk create accounts in the vault (each account associated with one asset)
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

        //One asset per account.
        let asset = new Asset();
        asset.id = input.asset_ids[i];
        asset.balance = 0;
        account.assets.push(asset);        

        vault.accounts.push(account);
    }
    vault.save();
    emit("Accounts created successfully");
}