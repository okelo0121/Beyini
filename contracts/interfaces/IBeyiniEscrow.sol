// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { BeyiniTypes } from "../libraries/BeyiniTypes.sol";

/**
 * @title IBeyiniEscrow
 * @notice Interface for the Beyini Escrow protocol on Monad
 */
interface IBeyiniEscrow {
    // Custom Errors
    error ZeroAddress();
    error ZeroAmount();
    error PaymentAlreadyExists(bytes32 paymentId);
    error PaymentNotFound(bytes32 paymentId);
    error PaymentNotActive(bytes32 paymentId);
    error CommitmentMismatch();
    error SignatureExpired();
    error InvalidSignature();
    error PaymentNotExpired(uint64 expiry, uint64 currentTimestamp);
    error UnauthorizedSender();
    error TransferFailed();

    // Events
    event PaymentDeposited(
        bytes32 indexed paymentId,
        address indexed sender,
        address indexed token,
        uint256 amount,
        bytes32 commitment,
        uint64 expiry
    );

    event PaymentClaimed(
        bytes32 indexed paymentId,
        address indexed destination,
        uint256 amount,
        address token
    );

    event PaymentRefunded(
        bytes32 indexed paymentId,
        address indexed sender,
        uint256 amount,
        address token
    );

    /**
     * @notice Deposit funds into escrow with a zero-PII commitment hash
     * @param paymentId Unique payment identifier generated off-chain
     * @param commitment Cryptographic commitment: keccak256(abi.encodePacked(identifierHash, salt))
     * @param token ERC-20 token address (e.g. Circle USDC on Monad)
     * @param amount Token amount to deposit
     * @param duration Lock duration in seconds before refund is permitted
     */
    function deposit(
        bytes32 paymentId,
        bytes32 commitment,
        address token,
        uint256 amount,
        uint64 duration
    ) external returns (bytes32);

    /**
     * @notice Claim funds by revealing the commitment pre-image (identifier hash + secret salt)
     * @param paymentId Unique payment identifier
     * @param destination Chosen recipient destination address (wallet or off-ramp rail)
     * @param identifierHash Hash of recipient phone/email/username
     * @param salt Secret unmasking salt generated at payment creation
     */
    function claimWithPreimage(
        bytes32 paymentId,
        address destination,
        bytes32 identifierHash,
        bytes32 salt
    ) external;

    /**
     * @notice Claim funds using EIP-712 typed signature authorized by the recipient or oracle relayer
     * @param paymentId Unique payment identifier
     * @param destination Chosen recipient destination address
     * @param deadline Signature expiry timestamp
     * @param signature Cryptographic secp256k1 signature
     */
    function claimWithSignature(
        bytes32 paymentId,
        address destination,
        uint256 deadline,
        bytes calldata signature
    ) external;

    /**
     * @notice Refund uncollected funds to original sender after the expiry period has elapsed
     * @param paymentId Unique payment identifier
     */
    function refund(bytes32 paymentId) external;

    /**
     * @notice Read payment details
     * @param paymentId Unique payment identifier
     */
    function getPayment(bytes32 paymentId) external view returns (BeyiniTypes.Payment memory);
}
