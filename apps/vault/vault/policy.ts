import { JSON, HTTP, Notifier, HttpRequest } from "@klave/sdk"
import { ErrorMessage } from "../klave/types";

// enum Usage {
//     RECOVERY = "RECOVERY",
//     BLOCKING = "BLOCKING",
//     UNBLOCKING = "UNBLOCKING",
//     POLICY_CHANGE = "POLICY_CHANGE"
// };

@JSON
export class Policy {
    id: string;
    usage: string;  //Usage

    constructor() {
        this.id = "";
        this.usage = "";
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