import { JSON, Ledger, Crypto } from "@klave/sdk"
import { encode as b64encode } from 'as-base64/assembly';
import { convertToUint8Array } from "../klave/helpers";

@JSON
export class ChainedItems<T> {
    first: string;
    last: string;
    size: number;

    constructor() {
        this.first = "";
        this.last = "";
        this.size = 0;
    }

    getIndex(index: number): T | null {
        if (index >= this.size) {
            return null;
        }
        let current = this.first;
        for (let i = 0; i < index; i++) {
            current = Ledger.getTable(current).get("next");
        }
        return JSON.parse<T>(Ledger.getTable(current).get("value"));
    }

    getAll(): Array<T> {
        let result = new Array<T>();
        let current = this.first;
        for (let i = 0; i < this.size; i++) {
            result.push(JSON.parse<T>(Ledger.getTable(current).get("value")));
            current = Ledger.getTable(current).get("next");
        }
        return result;
    }

    getAllUntilIndex(index: number): Array<T> {
        let result = new Array<T>();
        if (index >= this.size) {
            return result;
        }
        let current = this.first;
        for (let i = 0; i < index; i++) {
            result.push(JSON.parse<T>(Ledger.getTable(current).get("value")));
            current = Ledger.getTable(current).get("next");
        }
        return result;
    }

    add<T>(value: T): void {        
        let new_id = b64encode(convertToUint8Array(Crypto.getRandomValues(64)));
        let table = Ledger.getTable(new_id);
        table.set("value", JSON.stringify<T>(value));
        table.set("prev", this.last);
        if (this.size == 0) {
            this.first = new_id;
        } else {
            Ledger.getTable(this.last).set("next", new_id);
        }
        this.last = new_id;
        this.size++;
    }

    removeIndex(index: number): void {
        if (index >= this.size) {
            return;
        }
        let current = this.first;
        for (let i = 0; i < index; i++) {
            current = Ledger.getTable(current).get("next");
        }
        let prev = Ledger.getTable(current).get("prev");
        let next = Ledger.getTable(current).get("next");
        if (prev != "") {
            Ledger.getTable(prev).set("next", next);
        }
        if (next != "") {
            Ledger.getTable(next).set("prev", prev);
        }
        Ledger.getTable(current).unset("value");
        Ledger.getTable(current).unset("prev");
        Ledger.getTable(current).unset("next");
        this.size--;
    }

    reset(): void {
        let current = this.first;
        while (current != "") {
            let next = Ledger.getTable(current).get("next");
            Ledger.getTable(current).unset("value");
            Ledger.getTable(current).unset("prev");
            Ledger.getTable(current).unset("next");
            current = next;
        }
        this.first = "";
        this.last = "";
        this.size = 0;
    }

    getAllAsString(): string {
        let str = "";
        let all = this.getAll();
        for (let i = 0; i < all.length; i++) {            
            let item = all[i];
            if (str.length > 0) {
                str += ", ";
            }
            str += JSON.stringify<T>(item);
        }
        return str;
    }
} 

