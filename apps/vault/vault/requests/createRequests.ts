import { JSON, Ledger, Crypto } from "@klave/sdk"
import { emit, revert } from "../../klave/types"
import { encode as b64encode } from 'as-base64/assembly';
import { convertToUint8Array } from "../../klave/helpers";
import { ChainedItems } from "../../klave/chained";
import { Request } from "./requests";

const CreateRequestsTable = "CreateRequestsTable";

@JSON
export class CreateRequest extends Request {
    walletName: string;

    constructor() {
        super();
        this.walletName = "";
    }

    static load(requestId: string): CreateRequest | null {
        let requestTable = Ledger.getTable(CreateRequestsTable).get(requestId);
        if (requestTable.length == 0) {
            revert(`Request ${requestId} does not exist. Create it first`);
            return null;
        }
        let request = JSON.parse<CreateRequest>(requestTable);
        emit(`Request loaded successfully: '${request.id}'`);
        return request;
    }

    save(): void {
        let requestTable = JSON.stringify<CreateRequest>(this);
        Ledger.getTable(CreateRequestsTable).set(this.id, requestTable);
        emit(`Request saved successfully: '${this.id}'`);
    }

    static delete(requestId: string): void {
        let request = CreateRequest.load(requestId);
        if (!request) {
            return;
        }
        Ledger.getTable(CreateRequestsTable).unset(requestId);
        emit(`Request deleted successfully: '${requestId}'`);
    }

    static create(walletName: string, userId: string, role: string): CreateRequest {
        let request = new CreateRequest();
        request.id = b64encode(convertToUint8Array(Crypto.getRandomValues(64)));
        request.walletName = walletName;
        request.userId = userId;
        request.role = role;
        request.save();
        emit(`Request created successfully: '${request.id}'`);
        return request;
    }
}


export class ChainedCreateRequests extends ChainedItems<CreateRequest> {
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

    add(request: CreateRequest) : void {
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
                str += `{"id":"${item.id}","walletName":"${item.walletName}","userId":"${item.userId}","role":"${item.role}"}`;
            }
        }
        str = `[${str}]`;
        return str;
    }    
}
