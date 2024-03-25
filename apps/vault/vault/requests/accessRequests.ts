import { JSON, Ledger, Crypto } from "@klave/sdk"
import { emit, revert } from "../../klave/types"
import { encode as b64encode } from 'as-base64/assembly';
import { convertToUint8Array } from "../../klave/helpers";
import { ChainedItems } from "../../klave/chained";
import { Request } from "./requests";

const AccessRequestsTable = "AccessRequestsTable";

@JSON
export class AccessRequest extends Request {
    walletId: string;

    constructor() {
        super();
        this.walletId = "";
    }

    static load(requestId: string): AccessRequest | null {
        let requestTable = Ledger.getTable(AccessRequestsTable).get(requestId);
        if (requestTable.length == 0) {
            revert(`Request ${requestId} does not exist. Create it first`);
            return null;
        }
        let request = JSON.parse<AccessRequest>(requestTable);
        emit(`Request loaded successfully: '${request.id}'`);
        return request;
    }

    save(): void {
        let requestTable = JSON.stringify<AccessRequest>(this);
        Ledger.getTable(AccessRequestsTable).set(this.id, requestTable);
        emit(`Request saved successfully: '${this.id}'`);
    }

    static delete(requestId: string): void {
        let request = AccessRequest.load(requestId);
        if (!request) {
            return;
        }
        Ledger.getTable(AccessRequestsTable).unset(requestId);
        emit(`Request deleted successfully: '${requestId}'`);
    }

    static create(walletId: string, userId: string, role: string): AccessRequest {
        let request = new AccessRequest();
        request.id = b64encode(convertToUint8Array(Crypto.getRandomValues(64)));
        request.walletId = walletId;
        request.userId = userId;
        request.role = role;
        request.save();
        emit(`Request created successfully: '${request.id}'`);
        return request;
    }
}


export class ChainedAccessRequests extends ChainedItems<AccessRequest> {
    constructor() {
        super();
    }    

    includes(id: string): boolean {
        let all = this.getAll();
        emit(`Checking if requestId ${id} is in the list of requests: ${JSON.stringify(all)}`);
        for (let i = 0; i < all.length; i++) {            
            let item = all[i];
            if (item.id == id) {
                return true;
            }
        }
        return false;
    }

    remove(requestId: string): void {
        let all = this.getAll();
        for (let i = 0; i < all.length; i++) {
            let item = all[i];
            if (item.id == requestId) {
                this.removeIndex(i);
                break;
            }
        }
    }

    add(request: AccessRequest) : void {
        this.add_with_id(request, request.id);
    }

    getInfo(): string {
        let str = "";
        let all = this.getAll();
        for (let i = 0; i < all.length; i++) {            
            let item = all[i];
            if (str.length > 0) {
                str += ", ";
            }            
            if (item) {
                str += `{"id":"${item.id}","walletId":"${item.walletId}","userId":"${item.userId}","role":"${item.role}"}`;
            }
        }
        str = `[${str}]`;
        return str;
    }    
}
