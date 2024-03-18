// SPDX-License-Identifier: MIT
// Inspired by OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/IERC20.sol)
import {address, amount} from "../../../klave/types"

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
export interface IERC20 {
    /**
     * @dev Returns the value of tokens in existence.
     */
    totalSupply() : amount;

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    balanceOf(account: address) : amount;

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    transfer(to: address, value: amount) : boolean;

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    allowance(owner : address, spender: address) : amount;

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    approve(spender: address, value: amount) : boolean;

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    transferFrom(from: address, to: address, value: amount) : boolean;
}
