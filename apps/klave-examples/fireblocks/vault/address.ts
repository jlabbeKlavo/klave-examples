import { JSON } from '@klave/sdk';


@JSON
export class Address {
    assetId: string;
    address: string;
    description: string;
    tag: string;
    type: string;
    customerRefId: string;
    addressFormat: string;
    legacyAddress: string;
    entrepriseAddress: string;
    
    updateDescription(description: string): void {
        this.description = description;
    }

    setCustomerRefId(customerRefId: string): void {
        this.customerRefId = customerRefId;
    }
}