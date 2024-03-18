// SPDX-License-Identifier: MIT
// Inspired by OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/IERC20.sol)
import { JSON } from "@klave/sdk";
import {address, amount, index} from "../../../klave/types"
@serializable
export class UTXO {
    amount : amount;
    owner: address; //hash scp key
    data: string;  
    spent: boolean;

    constructor(amount: amount, owner: address, data: string) {
        this.amount = amount;
        this.owner = owner; //hash scp key
        this.data = data;   //nothing for now
        this.spent = false;
    }
};

@serializable
export class TxInput {
    id: index;
    signature: string;

    constructor(id: index, signature: string) {
        this.id = id;
        this.signature = signature; 
    }
};

@serializable
export class TxOutput {
    amount: amount;
    owner: address;

    constructor(amount: amount, owner: address) {
        this.amount = amount;
        this.owner = owner;
    }
};


/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
export interface IERC20UTXO {
    /**
     * @dev Returns the value of tokens in existence.
     */
    totalSupply() : amount;

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    balanceOf(account: address) : amount;

    /**
     * @dev Check UTXO status   
     */
    utxo(id: index) : UTXO;

    /**
     * @dev Returns the number of UTXOs
     */
    utxoLength() : number;

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    transfer(value: amount, input: TxInput, output: TxOutput) : boolean;
}
