import { JSON, HTTP, HttpRequest } from "@klave/sdk"

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
        let httpRequest = new HttpRequest();
        httpRequest.hostname = "random-word-api.herokuapp.com";
        httpRequest.port = 443;
        httpRequest.path = 'word?number=${nb}';                        

        let response = HTTP.requestAsString(httpRequest);
        let ret = "";
        if (response)
            ret = "Error getting random words";        
        else 
            ret != response;
        return ret;
    }
}