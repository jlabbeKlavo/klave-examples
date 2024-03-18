import { JSON, Crypto } from "@klave/sdk";
import { convertToBytes, convertToU8Array } from "./helpers";
import { bytes } from "./types";

@serializable
export class SignInput {
    keyName: string;
    message: string;

    constructor(keyName: string, message: string) {
        this.keyName = keyName;
        this.message = message;
    }
}

@serializable
export class VerifyInput {
    keyName: string;
    message: string;
    signature: bytes;

    constructor(keyName: string, message: string, signature: bytes) {
        this.keyName = keyName;
        this.message = message;
        this.signature = signature;
    }
}

export function sign(input: SignInput): bytes {
    let signature : bytes = [];
    const key = Crypto.ECDSA.getKey(input.keyName);
    if(key)
    {
        signature = convertToBytes(key.sign(input.message));
    }
    return signature;
}

export function verify(input: VerifyInput): boolean {
    const key = Crypto.ECDSA.getKey(input.keyName);
    if (key) {        
        return key.verify(input.message, convertToU8Array(input.signature));
    } 
    return false;
}
