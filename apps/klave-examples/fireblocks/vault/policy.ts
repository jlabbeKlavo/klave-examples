// enum Usage {
//     RECOVERY = "RECOVERY",
//     BLOCKING = "BLOCKING",
//     UNBLOCKING = "UNBLOCKING",
//     POLICY_CHANGE = "POLICY_CHANGE"
// };

export class Policy {
    id: string;
    usage: string;  //Usage

    constructor() {
        this.id = "";
        this.usage = "";
    }
}