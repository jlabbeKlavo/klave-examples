import {IERC20Errors} from "../interfaces/draft-IERC6093";
import {address, amount, index} from "../klave/types"

export class IERC20Events extends IERC20Errors {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    TransferEvent(from: address, to: address, value: amount) : string {
        return `Transfer of ${value} from ${from} to ${to} is now successful`;
    }

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    ApprovalEvent(owner: address, spender: address, value: amount) : string {
        return `Allowance of ${value} by ${owner} to ${spender} is now approved`;
    }
}

export class IERC20UTXOEvents extends IERC20Events {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    UTXOCreated(id: index, creator: address) : string {
        return `UTXO ${id} by ${creator} is successfully created`;
    }

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    UTXOSpent(id: index, spender: address) : string {
        return `UTXO ${id} is successfully spent by ${spender}`;
    }
}
