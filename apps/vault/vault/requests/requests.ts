import { JSON } from "@klave/sdk"

@JSON
export class Request {
    id: string;
    userId: string;
    role: string;

    constructor() {
        this.id = "";
        this.userId = "";
        this.role = "";
    }
}

