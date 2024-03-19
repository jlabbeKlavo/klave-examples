import {JSON} from "@klave/sdk"
import {address, amount, index} from "../../klave/types"


@serializable
export class Allowance {
    spender: address;
    value: amount;

    constructor(spender: address, value: amount) {
        this.spender = spender;
        this.value = value;
    }
}

@serializable
export class Account {        
    owner: address;
    balance: amount;
    allowance: Array<Allowance>;    

    constructor(owner: address, balance: amount) {
        this.owner = owner;
        this.balance = balance;
        this.allowance = new Array<Allowance>();
    }

    findAllowance(spender: address): index {
        for (let i = 0; i < this.allowance.length; i++) {
            if (this.allowance[i].spender == spender) {
                return i;
            }
        }
        return -1;
    }

    addToAllowance(spender: address, value: amount): void {
        let index = this.findAllowance(spender);
        if (index != -1) {
            this.allowance[index].value += value;
        } else {
            this.allowance.push(new Allowance(spender, value));
        }
    }

    subtractFromAllowance(spender: address, value: amount): void {
        let index = this.findAllowance(spender);
        if (index != -1) {
            this.allowance[index].value -= value;
        } else {
            this.allowance.push(new Allowance(spender, 0));
        }
    }

    getAllowance(spender: address): amount {
        let index = this.findAllowance(spender);
        if (index != -1) {
            return this.allowance[index].value;
        }
        return 0;
    }
}

