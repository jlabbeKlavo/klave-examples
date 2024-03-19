import { JSON, HTTP, HttpRequest } from `@klave/sdk`

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
        httpRequest.method = "GET";
        httpRequest.hostname = "random-word-api.herokuapp.com";
        httpRequest.port = 443;
        httpRequest.path = 'word?number=${nb}';
        httpRequest.headers = [];
        httpRequest.body = '';        

        let response = HTTP.requestAsString(httpRequest);
       return response;
    }
}