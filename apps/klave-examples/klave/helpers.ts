export function convertToU8Array(input: Uint8Array): u8[] {
    let ret: u8[] = []; 
    for (let i = 0; i < input.length; ++i)
        ret[i] = input[i];

    return ret; 
}

export function convertToUint8Array(input: u8[]): Uint8Array {
    let value = new Uint8Array(input.length);
    for (let i = 0; i < input.length; ++i) {
        value[i] = input[i];
    }

    return value;    
}
