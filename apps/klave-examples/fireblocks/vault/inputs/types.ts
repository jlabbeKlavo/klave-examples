import { JSON } from "@klave/sdk";
import { amount } from '../../../klave/types';

@JSON
export class AccountsInput {
    namePrefix: string;
    nameSuffix: string;
    minAmountThreshold: amount;
    assetId: string;
}

@JSON
export class AccountsPagesInput extends AccountsInput {
    before: string;
    after: string;    
    limit: number;    
}

@JSON
export class RenameAccountInput {
    id: string;
    newName: string;
}

@JSON
export class HideAccountInput {
    id: string;
}

@JSON
export class UnhideAccountInput {
    id: string;
}

@JSON
export class SetCustomerRefIdInput {
    id: string;
    customerRefId: string;
}

@JSON
export class SetAutoFuelInput {
    id: string;
    autoFuel: boolean;
}

@JSON 
export class CreateAccountInput {
    name: string;
    hiddenOnUI: boolean;
    customerRefId: string;
    autoFuel: boolean;
}

@JSON
export class BulkCreateAccountInput {
    count: number;
    asset_ids: Array<string>;
}

@JSON 
export class SignInput {
    accountId: string;
    assetId: string;
    payload: string;
}