// SPDX-License-Identifier: UNLICENSED

import { JSON, Context } from "@klave/sdk"
import { address, amount, index, revert, emit } from "../../../klave/types"
import { verify, VerifyInput } from "../../../klave/crypto"
import { Account, UTXOBrief } from "../../../klave/ERC20UTXO/ERC20UTXOStructs"
import { IERC20UTXO, UTXO, TxInput, TxOutput } from "./IERC20UTXO"
import { IERC20UTXOEvents } from "../../interfaces/ERC20Events";

@serializable
export class TransferOutput {
    creatorId: index;
    ownerId: index;

    constructor(creatorId: index, ownerId: index) {
        this.creatorId = creatorId;
        this.ownerId = ownerId;
    }
}

@serializable
export class ERC20UTXO extends IERC20UTXOEvents implements IERC20UTXO {
    _utxos: Array<UTXO>;    
    _accounts: Array<Account>;

    _decimals: number;
    _totalSupply: amount;
    _name: string;
    _symbol: string;

    /**
     * @dev Sets the values for {name} and {symbol}.
     *
     * All two of these values are immutable: they can only be set once during
     * construction.
     */
    constructor(name_: string, symbol_: string, decimals_: number, totalSupply_: amount) {
        super();
        this._name = name_;
        this._symbol = symbol_;
        this._decimals = decimals_;
        this._totalSupply = totalSupply_;
        this._accounts = new Array<Account>();        
        this._utxos = new Array<UTXO>();
    }

    /**
     * @dev Returns the name of the token.
     */
    name() : string {
        return this._name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    symbol() : string {
        return this._symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the default value returned by this function, unless
     * it's overridden.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    decimals() : number {
        return this._decimals;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    totalSupply() : amount {
        return this._totalSupply;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    balanceOf(account: address) : amount {
        return this.account(account).balance;
    }

    utxoLength() : number {
        return this._utxos.length;
    }

    _nextId() : index {
        var current_max : index = this._utxos.length;
        return current_max;
    }

    utxo(id: index) : UTXO {                
        if (id < this._utxos.length) {
            revert("ERC20UTXO: id out of bound");
        } 
        return this._utxos[id];
    }

    transfer(amount: amount, input: TxInput, output: TxOutput) : boolean {
        let creator = Context.get('sender');
        this._transfer(amount, input, output, creator);        
        emit(this.TransferEvent(creator, output.owner, amount));
        return true;
    }

    _transfer(amount: amount, input: TxInput, output: TxOutput, creator: address) : TransferOutput {
        let transferOutput = new TransferOutput(0, 0);        
        let cache = this._utxos[input.id];
        if (output.amount > cache.amount) {
            revert("ERC20UTXO: transfer amount exceeds utxo amount");
            return transferOutput;
        }
        if (output.amount < cache.amount) {
            let value = cache.amount - output.amount;
            this._spend(input, creator);
            {
                this.removeFromBalance(creator, amount);
                this.addToBalance(output.owner, amount);
            }
            transferOutput.ownerId = this._create(output, creator, cache.data);
            transferOutput.creatorId = this._create(new TxOutput(value, creator), creator, cache.data);
        } else {
            this._spend(input,creator);
            {
                this.removeFromBalance(creator, amount);
                this.addToBalance(output.owner, amount);
            }
            transferOutput.ownerId = this._create(output, creator, cache.data);
        }
        return transferOutput;
    }

    mint(amount: amount, output: TxOutput, data: string) : index {
        if (output.amount != amount) {
            revert("ERC20UTXO: invalid amounts");
            return -1;
        } 
        this._totalSupply += amount;        
        this.addToBalance(output.owner, amount);
        return this._create(output, "", data);
    }

    burn(amount: amount, output: TxOutput, data: string) : index {
        if (output.amount != amount) {
            revert("ERC20UTXO: invalid amounts");
            return -1;
        } 
        if (this._totalSupply < amount) {
            revert("ERC20UTXO: insufficient supply");
            return -1;
        }
        if (this.account(output.owner).balance < amount) {
            revert("ERC20UTXO: insufficient balance");
            return -1;
        }
        this._totalSupply -= amount;        
        this.removeFromBalance(output.owner, amount);
        return this._create(output, "", data);
    }

    _create(output: TxOutput, creator: address, data: string) : index {
        if (output.owner.length == 0) {
            revert("ERC20UTXO: create utxo output to zero address");
            return -1;
        }
        let id = this._nextId();
        let utxo = new UTXO(output.amount, output.owner, data);
        
        this._beforeCreate(output.owner,utxo);

        this._utxos.push(utxo);
        emit(this.UTXOCreated(id, creator));

        this._afterCreate(output.owner,utxo, id);       
        return id; 
    }

    _spend(input: TxInput, spender: address) : void {
        if (input.id > this._utxos.length) {
            revert("ERC20UTXO: utxo id out of bound");
            return;
        }
        let utxo = this._utxos[input.id];
        
        if(utxo.spent) {
            revert("ERC20UTXO: utxo has already been spent");
            return;
        }

        this._beforeSpend(utxo.owner,utxo);
                        
        let verifyInput = new VerifyInput(utxo.owner, input.id.toString(), input.signature);
        emit(`verifyInput: ${JSON.stringify(verifyInput)}`);

        if (!verify(verifyInput)) {
            revert("ERC20UTXO: invalid signature");
            return;
        }

        this._utxos[input.id].spent = true;
        emit(this.UTXOSpent(input.id, spender));

        this._afterSpend(utxo.owner,utxo,input.id);
    }

    _beforeCreate(owner: address, utxo: UTXO) : void {}

    _afterCreate(owner: address, utxo: UTXO, id: index) : void {
        this.addUTXOtoAccount(owner, utxo, id);
    }

    _beforeSpend(spender: address, utxo: UTXO) : void {}

    _afterSpend(spender: address, utxo: UTXO, id: index) : void {
        this.removeUTXOfromAccount(spender, id);
    }
    
    /**
     * @dev Returns the account associated with `account`.
     */
    findAccount(account: address) : index {
        for (let i = 0; i < this._accounts.length; i++) {
            if (this._accounts[i].owner == account) {
                return i;
            }
        }
        emit(`Account for ${account} does not exist`)
        return -1;
    }

    /**
     * @dev Returns the account associated with `account`.
     */
    account(account: address) : Account {
        let index = this.findAccount(account);
        if (index != -1) {
            return this._accounts[index];
        }
        emit(`Account for ${account} does not exist`)
        return new Account("", 0);
    }

    /**
     * @dev Returns the account associated with `account`.
     */
    accountHolder(account: address) : boolean {
        return this.account(account).owner.length != 0;
    }

    /**
     * @dev Creates a new account with `account` as the owner and `0` as the balance.
     */
    createAccount(account: address) : void {
        this._accounts.push(new Account(account, 0));
        emit(`Account for ${account} successfully created`);
    }

    addUTXOtoAccount(owner: address, utxo: UTXO, id: index) : void {
        let index = this.findAccount(owner);
        if (index != -1) {
            this._accounts[index].utxoList.push(new UTXOBrief(id, utxo.amount));
            emit(`UTXO for ${owner} successfully added to account`);
        }
    }

    removeUTXOfromAccount(spender: address, id: index) : void {
        let index = this.findAccount(spender);
        if (index != -1) {
            this._accounts[index].utxoList.splice(id, 1);
            emit(`UTXO for ${spender} successfully removed from account`);
        }
    }

    addToBalance(account: address, amount: amount) : void {
        let index = this.findAccount(account);
        if (index != -1) {
            this._accounts[index].balance += amount;
            emit(`Balance for ${account} successfully added`);
        }
    }

    removeFromBalance(account: address, amount: amount) : void {
        let index = this.findAccount(account);
        if (index != -1) {
            this._accounts[index].balance -= amount;
            emit(`Balance for ${account} successfully removed`);
        }
    }
}