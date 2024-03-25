import { Ledger, Crypto, JSON, Context } from '@klave/sdk'
import { emit, revert } from "../klave/types"
import { SignInput, VerifyInput, sign, verify } from "../klave/crypto";
import { encode as b64encode, decode as b64decode } from 'as-base64/assembly';
import { convertToUint8Array, convertToU8Array } from "../klave/helpers";
import { ChainedItems } from '../klave/chained';

const KeysTable = "KeysTable";

@JSON
export class Key {
    id: string;
    description: string;
    type: string;
    owner: string;

    constructor(id: string) {
        this.id = id;
        this.description = "";
        this.type = "";
        this.owner = "";
    }

    static load(keyId: string) : Key | null {        
        let keyTable = Ledger.getTable(KeysTable).get(keyId);
        if (keyTable.length == 0) {
            revert("Key does not exist. Create it first");
            return null;
        }
        let key = JSON.parse<Key>(keyTable);        
        emit(`Key loaded successfully: '${key.id}'`);        
        return key;
    }

    save(): void {
        let keyTable = JSON.stringify<Key>(this);
        Ledger.getTable(KeysTable).set(this.id, keyTable);
        emit(`User saved successfully: '${this.id}'`);        
    }

    static create(description: string, type: string): Key | null {
        let key = new Key("");
        key.id = b64encode(convertToUint8Array(Crypto.getRandomValues(64)));
        key.description = description;
        key.type = type;
        key.owner = Context.get('sender');
        if (key.type == "ECDSA") {
            const keyECDSA = Crypto.ECDSA.generateKey(key.id);
            if (keyECDSA) {
                emit(`SUCCESS: Key '${key.id}' has been generated`);
                return key;
            } else {
                revert(`ERROR: Key '${key.id}' has not been generated`);
                return null;
            }
        }
        else if (key.type == "AES") {
            const keyAES = Crypto.AES.generateKey(key.id);
            if (keyAES) {
                emit(`SUCCESS: Key '${key.id}' has been generated`);
                return key;
            } else {
                revert(`ERROR: Key '${key.id}' has not been generated`);
                return null;
            }
        }
        else {
            revert(`ERROR: Key type '${key.type}' is not supported`);
            return null;
        }
    }

    static delete(keyId: string): void {
        let key = Key.load(keyId);
        if (!key) {
            return;
        }        
        key.reset();
        Ledger.getTable(KeysTable).unset(keyId);
        emit(`Key deleted successfully: '${keyId}'`);
    }

    reset(): void {
        if (this.type == "ECDSA") {
            // Crypto.ECDSA.deleteKey(this.id);
        }
        else if (this.type == "AES") {
            // Crypto.AES.deleteKey(this.id);
        }
        this.id = "";
        this.description = "";
        this.type = "";
        this.owner = "";
    }

    sign(message: string): string | null {
        if (this.type != "ECDSA") {
            revert("ERROR: Key type is not ECDSA")
            return null;
        }        
        return sign(new SignInput(this.id, message));
    }

    verify(message: string, signature: string): boolean {
        if (this.type != "ECDSA") {
            revert("ERROR: Key type is not ECDSA")
            return false;
        }        
        return verify(new VerifyInput(this.id, message, signature));
    }    

    encrypt(message: string): string {
        if (this.type != "AES") {
            revert("ERROR: Key type is not AES");
            return "";
        }        
        let KeyAES = Crypto.AES.getKey(this.id);
        if (!KeyAES) {
            revert("ERROR: Key not found");
            return "";
        }        
        return b64encode(convertToUint8Array(KeyAES.encrypt(message)));
    }

    decrypt(cypher: string): string {
        if (this.type != "AES") {
            revert("ERROR: Key type is not AES");
            return "";
        }        
        let KeyAES = Crypto.AES.getKey(this.id);
        if (!KeyAES) {
            revert("ERROR: Key not found");
            return "";
        }        
        return KeyAES.decrypt(convertToU8Array(b64decode(cypher)));
    }
}

export class ChainedKeys extends ChainedItems<Key> {
    constructor() {
        super();
    }    

    includes(id: string): boolean {
        let all = this.getAll();
        for (let i = 0; i < all.length; i++) {            
            let item = all[i];
            if (item.id == id) {
                return true;
            }
        }
        return false;
    }

    remove(keyId: string): void {
        let all = this.getAll();
        for (let i = 0; i < all.length; i++) {
            let item = all[i];
            if (item.id == keyId) {
                this.removeIndex(i);
                break;
            }
        }
    }

    add(key: Key) : void {
        this.add_with_id(key, key.id);
    }
}