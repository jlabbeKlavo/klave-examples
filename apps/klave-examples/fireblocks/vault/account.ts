import { JSON } from "@klave/sdk";
import { Asset } from "./asset";
import { emit } from "../../klave/types";

/**
 * An account is associated with a customer and holds assets.
 * It can also represent a contract in the Ethereum network.
 */
@JSON
export class Account {
    id: string;
    name: string;
    assets: Array<Asset>;
    hiddenOnUI: boolean;
    customerRefId: string;
    autoFuel: boolean;

    constructor(accountId: string) {
        this.id = accountId;
        this.name = "";
        this.assets = new Array<Asset>();
        this.hiddenOnUI = false;
        this.customerRefId = "";
        this.autoFuel = false;        
    }

    rename(newName: string): void {
        this.name = newName;
        emit("Account renamed successfully");
    }

    hide(): void {
        this.hiddenOnUI = true;
        emit("Account hidden successfully");
    }

    unhide(): void {
        this.hiddenOnUI = false;
        emit("Account unhidden successfully");
    }

    setCustomerRefId(customerRefId: string): void {
        this.customerRefId = customerRefId;
        emit("Customer reference id set successfully");
    }

    setAutoFuel(autoFuel: boolean): void {
        this.autoFuel = autoFuel;
        emit("Auto fuel flag set successfully");
    }

    getAssetIndex(assetId: string): i32 {
        for (let i = 0; i < this.assets.length; i++) {
            if (this.assets[i].id == assetId) {
                return i;
            }
        }
        return -1;
    }

    createWallet(assetId: string): Asset {
        let asset = new Asset(assetId);
        asset.id = assetId;        
        this.assets.push(asset);
        return asset;
    }
    
    activateWallet(assetId: string): void {
        let index = this.getAssetIndex(assetId);
        if (index == -1) {
            emit("Account not found");            
        } else {
            this.assets[index].available = true;
            emit("Wallet activated successfully");
        }
    }

    deactivateWallet(assetId: string): void {
        let index = this.getAssetIndex(assetId);
        if (index == -1) {
            emit("Account not found");            
        } else {
            this.assets[index].available = false;
            emit("Wallet deactivated successfully");
        }
    }

    refreshAssetBalance(assetId: string): void {
        let index = this.getAssetIndex(assetId);
        if (index == -1) {
            emit("Account not found");            
        } else {
            this.assets[index].refreshBalance();
            emit("Asset balance refreshed successfully");
        }
    }

    /**
     * Get the addresses associated with an asset and paginated according to .
     * @param assetId The id of the asset.
     * @returns The addresses associated with the asset.
     */     
    getAddressesPaginated(assetId: string, before: string, after: string, limit: number): Array<Address> | null {
        let index = this.getAssetIndex(assetId);
        if (index == -1) {
            emit("Account not found");
            return null;
        }
        return this.assets[index].getAddressesPaginated(before, after, limit);            
    }

    sign(assetId: string, payload: string) : void {
        let index = this.getAssetIndex(assetId);
        if (index == -1) {
            emit("Account not found");            
        }
        else {
            this.assets[index].sign(payload);
        }
    }

}