import { JSON } from "@klave/sdk"

@JSON
export class CreateVaultInput {
    name: string;
}

@JSON
export class RenameWalletInput {
    walletId: string;
    oldName: string;
    newName: string;
}

@JSON
export class CreateWalletInput {
    name: string;
}

@JSON
export class DeleteWalletInput {
    walletId: string;
}

@JSON 
export class SignInput {
    walletId: string;
    keyId: string;
    payload: string;
}

@JSON
export class VerifyInput {
    walletId: string;
    keyId: string;
    payload: string;
    signature: string;    
}

@JSON 
export class AddUserInput {    
    userId: string;
    role: string;
}

@JSON 
export class RemoveUserInput {
    userId: string;    
}

@JSON 
export class AddUserToWalletInput {    
    walletId: string;    
    userId: string;
    role: string;
}

@JSON
export class RemoveUserFromWalletInput {
    walletId: string;
    userId: string;
}

@JSON 
export class AddKeyInput {
    walletId: string;
    description: string;
    type: string;
}

@JSON 
export class RemoveKeyInput {
    walletId: string;
    keyId: string;    
}

@JSON
export class ListUsersInput {
    user: string;
}

@JSON
export class ListWalletsInput {    
    user: string;
}

@JSON
export class ListKeysInput {
    walletId: string;
    user: string;
}

@JSON
export class ResetInput {
    keys: string[];
}
