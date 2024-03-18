import { bytes } from "./types";

export function convertToU8Array(input: bytes): u8[] {
    let ret: u8[] = []; 
    for (let i = 0; i < input.length; ++i)
        ret[i] = input[i];

    return ret; 
}

export function convertToBytes(input: u8[]): bytes {
    let value: bytes = [];
    for (let i = 0; i < input.length; ++i) {
        value[i] = input[i];
    }

    return value;    
}
