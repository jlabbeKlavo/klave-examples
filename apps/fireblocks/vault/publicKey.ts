import { JSON } from "@klave/sdk";

// enum Algorithm {
//     ECDSA = "ECDSA",
//     RSA = "RSA",
//     EDDSA = "EDDSA",
//     SECP256K1 = "SECP256K1",
//     ED25519 = "ED25519",
//     SRP = "SRP",
//     AES = "AES",
//     RSA_OAEP = "RSA_OAEP",
//     RSA_PSS = "RSA_PSS",
//     AES_GCM = "AES_GCM",
//     AES_CBC = "AES_CBC",
//     SHA256 = "SHA256",
//     SHA384 = "SHA384",
//     SHA512 = "SHA512",
//     SHA3_256 = "SHA3_256",
//     SHA3_384 = "SHA3_384",
//     SHA3_512 = "SHA3_512",
//     BLAKE2B = "BLAKE2B",
//     BLAKE2 = "BLAKE2",
//     HMAC = "HMAC",
//     HKDF = "HKDF",
//     PBKDF2 = "PBKDF2",
//     SCRYPT = "SCRYPT",
//     ARGON2 = "ARGON2",
//     X25519 = "X25519",
//     X448 = "X448",
//     CHACHA20 = "CHACHA20",
//     POLY1305 = "POLY1305",
//     XCHACHA20 = "XCHACHA20",    
// }


@JSON
export class PublicKeyInfo {
    algorithm: string;  //Algorithm
    derivationPath: Array<number>;
    publicKey: string;

    constructor() {
        this.algorithm = "";
        this.derivationPath = new Array<number>();
        this.publicKey = "";
    }
};