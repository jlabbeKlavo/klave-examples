import { JSON } from "@klave/sdk"
import { amount } from "../../klave/types"

@serializable
export class CreateInput {
    name!: string;
    symbol!: string;
    decimals!: number;
    totalSupply!: amount;
}

@serializable
export class TransferInput {    
    to!: string;
    value!: amount;    
}

@serializable
export class ApproveInput {    
    spender!: string;
    value!: amount;    
}

@serializable
export class TransferFromInput {
    from!: string;
    to!: string;
    value!: amount;
}

@serializable
export class AllowanceInput {
    owner!: string;
    spender!: string;
}

@serializable
export class IncreaseAllowanceInput {
    spender!: string;
    addedValue!: amount;
}

@serializable
export class DecreaseAllowanceInput {
    spender!: string;
    subtractedValue!: amount;
}

@serializable
export class MintInput {
    to!: string;
    value!: amount;
}

@serializable
export class BurnInput {
    from!: string;
    value!: amount; 
}

@serializable
export class BurnFromInput {
    spender!: string;
    value!: amount;
}