// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IBeyiniEscrow } from "../interfaces/IBeyiniEscrow.sol";
import { IERC20 } from "../interfaces/IERC20.sol";
import { BeyiniTypes } from "../libraries/BeyiniTypes.sol";

/**
 * @title BeyiniEscrow
 * @notice Production non-custodial escrow protocol for Monad.
 * Supports zero-PII commitment claims and gasless EIP-712 claims.
 * Optimized for Monad's parallel execution engine with disjoint payment storage slots.
 */
contract BeyiniEscrow is IBeyiniEscrow {
    // EIP-712 Domain and Typehashes
    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 public constant EIP712_DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 public constant CLAIM_TYPEHASH =
        keccak256("ClaimPermit(bytes32 paymentId,address destination,uint256 nonce,uint256 deadline)");

    // Owner and Trusted Signer for relayer-assisted claims
    address public owner;
    address public trustedSigner;

    // Disjoint storage per payment ID - ideal for Monad parallel execution
    mapping(bytes32 => BeyiniTypes.Payment) private _payments;
    mapping(bytes32 => uint256) public nonces;

    // Reentrancy guard
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not owner");
        _;
    }

    constructor(address _trustedSigner) {
        if (_trustedSigner == address(0)) revert ZeroAddress();
        owner = msg.sender;
        trustedSigner = _trustedSigner;
        _status = _NOT_ENTERED;

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes("BeyiniEscrow")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    /**
     * @notice Updates the trusted signer authorized to produce claim signatures
     */
    function setTrustedSigner(address _newSigner) external onlyOwner {
        if (_newSigner == address(0)) revert ZeroAddress();
        trustedSigner = _newSigner;
    }

    /**
     * @inheritdoc IBeyiniEscrow
     */
    function deposit(
        bytes32 paymentId,
        bytes32 commitment,
        address token,
        uint256 amount,
        uint64 duration
    ) external nonReentrant returns (bytes32) {
        if (token == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (_payments[paymentId].status != BeyiniTypes.PaymentStatus.NONE) {
            revert PaymentAlreadyExists(paymentId);
        }

        uint64 expiry = uint64(block.timestamp + duration);

        _payments[paymentId] = BeyiniTypes.Payment({
            sender: msg.sender,
            token: token,
            amount: amount,
            commitment: commitment,
            createdAt: uint64(block.timestamp),
            expiry: expiry,
            status: BeyiniTypes.PaymentStatus.DEPOSITED
        });

        _safeTransferFrom(token, msg.sender, address(this), amount);

        emit PaymentDeposited(paymentId, msg.sender, token, amount, commitment, expiry);

        return paymentId;
    }

    /**
     * @inheritdoc IBeyiniEscrow
     */
    function claimWithPreimage(
        bytes32 paymentId,
        address destination,
        bytes32 identifierHash,
        bytes32 salt
    ) external nonReentrant {
        if (destination == address(0)) revert ZeroAddress();

        BeyiniTypes.Payment storage payment = _payments[paymentId];
        if (payment.status == BeyiniTypes.PaymentStatus.NONE) {
            revert PaymentNotFound(paymentId);
        }
        if (payment.status != BeyiniTypes.PaymentStatus.DEPOSITED) {
            revert PaymentNotActive(paymentId);
        }

        // Verify pre-image commitment: keccak256(abi.encodePacked(identifierHash, salt))
        bytes32 computedCommitment = keccak256(abi.encodePacked(identifierHash, salt));
        if (computedCommitment != payment.commitment) {
            revert CommitmentMismatch();
        }

        payment.status = BeyiniTypes.PaymentStatus.CLAIMED;

        _safeTransfer(payment.token, destination, payment.amount);

        emit PaymentClaimed(paymentId, destination, payment.amount, payment.token);
    }

    /**
     * @inheritdoc IBeyiniEscrow
     */
    function claimWithSignature(
        bytes32 paymentId,
        address destination,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant {
        if (destination == address(0)) revert ZeroAddress();
        if (block.timestamp > deadline) revert SignatureExpired();

        BeyiniTypes.Payment storage payment = _payments[paymentId];
        if (payment.status == BeyiniTypes.PaymentStatus.NONE) {
            revert PaymentNotFound(paymentId);
        }
        if (payment.status != BeyiniTypes.PaymentStatus.DEPOSITED) {
            revert PaymentNotActive(paymentId);
        }

        uint256 nonce = nonces[paymentId]++;
        bytes32 structHash = keccak256(
            abi.encode(CLAIM_TYPEHASH, paymentId, destination, nonce, deadline)
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );

        address recovered = _recoverSigner(digest, signature);
        if (recovered != trustedSigner && recovered != payment.sender) {
            revert InvalidSignature();
        }

        payment.status = BeyiniTypes.PaymentStatus.CLAIMED;

        _safeTransfer(payment.token, destination, payment.amount);

        emit PaymentClaimed(paymentId, destination, payment.amount, payment.token);
    }

    /**
     * @inheritdoc IBeyiniEscrow
     */
    function refund(bytes32 paymentId) external nonReentrant {
        BeyiniTypes.Payment storage payment = _payments[paymentId];
        if (payment.status == BeyiniTypes.PaymentStatus.NONE) {
            revert PaymentNotFound(paymentId);
        }
        if (payment.status != BeyiniTypes.PaymentStatus.DEPOSITED) {
            revert PaymentNotActive(paymentId);
        }
        if (block.timestamp < payment.expiry) {
            revert PaymentNotExpired(payment.expiry, uint64(block.timestamp));
        }
        if (msg.sender != payment.sender) {
            revert UnauthorizedSender();
        }

        payment.status = BeyiniTypes.PaymentStatus.REFUNDED;

        _safeTransfer(payment.token, payment.sender, payment.amount);

        emit PaymentRefunded(paymentId, payment.sender, payment.amount, payment.token);
    }

    /**
     * @inheritdoc IBeyiniEscrow
     */
    function getPayment(bytes32 paymentId) external view returns (BeyiniTypes.Payment memory) {
        return _payments[paymentId];
    }

    // Internal Helpers

    function _recoverSigner(bytes32 digest, bytes calldata signature) internal pure returns (address) {
        if (signature.length != 65) revert InvalidSignature();

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }

        if (v < 27) {
            v += 27;
        }

        address signer = ecrecover(digest, v, r, s);
        if (signer == address(0)) revert InvalidSignature();
        return signer;
    }

    function _safeTransfer(address token, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, value)
        );
        if (!success || (data.length != 0 && !abi.decode(data, (bool)))) {
            revert TransferFailed();
        }
    }

    function _safeTransferFrom(address token, address from, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, value)
        );
        if (!success || (data.length != 0 && !abi.decode(data, (bool)))) {
            revert TransferFailed();
        }
    }
}
