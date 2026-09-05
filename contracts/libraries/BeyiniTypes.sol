// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BeyiniTypes
 * @notice Data structures and enums for the Beyini payment routing protocol on Monad
 */
library BeyiniTypes {
    /**
     * @notice State of an on-chain escrow payment
     */
    enum PaymentStatus {
        NONE,       // Uninitialized
        DEPOSITED,  // Locked in escrow, awaiting recipient claim
        CLAIMED,    // Settled to recipient's chosen destination rail
        REFUNDED    // Reclaimed by sender after expiry
    }

    /**
     * @notice Core escrow payment record stored on Monad
     */
    struct Payment {
        address sender;         // Initiator of the payment
        address token;          // ERC-20 token address (Circle USDC)
        uint256 amount;         // Amount deposited
        bytes32 commitment;     // Cryptographic commitment: keccak256(abi.encodePacked(idHash, salt))
        uint64 createdAt;       // Block timestamp of creation
        uint64 expiry;          // Expiration timestamp for refunds
        PaymentStatus status;   // Current lifecycle status
    }

    /**
     * @notice EIP-712 Claim Permit for authorized recipient payouts
     */
    struct ClaimPermit {
        bytes32 paymentId;      // Unique payment ID
        address destination;    // Recipient payout address (wallet or off-ramp liquidity pool)
        uint256 nonce;          // Anti-replay nonce
        uint256 deadline;       // Signature expiration timestamp
    }
}
