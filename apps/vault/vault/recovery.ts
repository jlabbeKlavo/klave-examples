import { JSON, Ledger, Crypto, HTTP, Notifier, HttpRequest, Context } from "@klave/sdk"
import { ErrorMessage } from "../klave/types";
import { encode as b64encode } from 'as-base64/assembly';
import { convertToUint8Array } from "../klave/helpers";
import { emit, revert } from "../klave/types";

// enum Usage {
//     RECOVERY = "RECOVERY",
//     BLOCKING = "BLOCKING",
//     UNBLOCKING = "UNBLOCKING",
//     POLICY_CHANGE = "POLICY_CHANGE"
// };

@JSON
export class RecoveryUser {
    id: string;
    code: string;

    constructor(id: string, code: string) {
        this.id = id;
        this.code = code;
    }
}

const RecoveryTable = "RecoveryTable";

@JSON
export class Recovery {
    backupKey: string;
    multiCustody: Array<RecoveryUser>;

    constructor() {
        this.backupKey = "";
        this.multiCustody = new Array<RecoveryUser>();
    }    

    /**
     * load the recovery struct from the ledger.
     * @returns true if the recovery struct was loaded successfully, false otherwise.
     */
    static load(): Recovery | null {
        let recoveryTable = Ledger.getTable(RecoveryTable).get("ALL");
        if (recoveryTable.length == 0) {
            revert("Recovery does not exist. Create it first");
            return null;
        }
        let recovery = JSON.parse<Recovery>(recoveryTable);
        emit("Recovery loaded successfully: " + recovery.toString());
        return recovery;
    }

    /**
     * save the recovery struct to the ledger.
     */
    save(): void {
        let recoveryTable = JSON.stringify<Recovery>(this);
        Ledger.getTable(RecoveryTable).set("ALL", recoveryTable);
        emit("Recovery saved successfully: " + JSON.stringify(this));
    }

    createDefault(): void {
        this.backupKey = b64encode(convertToUint8Array(Crypto.getRandomValues(64)));
        let recoveryUser = new RecoveryUser(Context.get('sender'), this.getRandomWords(5));        

        emit("Please save the following recovery code in a safe place: {" + recoveryUser.code + "} for user: " + recoveryUser.id);

        this.multiCustody.push(recoveryUser);
    }

    getRandomWords(nb: number) : string {
        const query: HttpRequest = {
            hostname: 'random-word-api.herokuapp.com',
            port: 443,
            path: `/word?number=${nb}`,
            headers: [],
            body: ''
        };
    
        const response = HTTP.requestAsString(query);
        if (!response) {
            Notifier.sendJson<ErrorMessage>({
                success: false,
                message: `HTTP call went wrong !`
            });
            return "HTTP call went wrong !";
        }
    
        return response;
    }
}