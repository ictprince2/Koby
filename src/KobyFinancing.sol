// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title KobyFinancing
 * @notice Onchain receivables-financing state machine for the Koby MVP.
 *
 * Lifecycle (no other transitions exist):
 *   Created -> Funded -> Repaying -> Completed
 *
 * - Creation records terms proposed by the business. Any connected wallet may
 *   submit Create specifying any business address (open creator, PRD 10).
 * - Funding is atomic settlement: one transaction pulls exactly the principal
 *   from the financier and pushes it straight to the business. The contract
 *   never holds funding balances; there is no escrow-release or claim step.
 * - Repayment is programmable tracking & execution: each validated repayment
 *   pulls from the business and pushes straight to the recorded financier in
 *   the same transaction. The contract never holds repayment balances.
 * - Completion is automatic in the same repayment transaction that brings
 *   outstanding to exactly zero; it is never separately callable.
 *
 * Accounting invariant (enforced on every write):
 *   outstanding = obligation - repaid, with repaid <= obligation always.
 *
 * MVP asset: a single stablecoin bound once as an immutable constructor
 * parameter. No other token is accepted. Decimals are a fixed verified
 * constant (6 for testnet USDC), never read per-use.
 *
 * No admin role, no pause, no upgrade path in the MVP. There is deliberately
 * no privileged financial override of any kind.
 */
contract KobyFinancing is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice MVP financing/repayment asset (single testnet stablecoin).
    IERC20 public immutable USDC;

    /// @notice Fixed verified decimals constant for the MVP asset (USDC: 6).
    uint8 public constant USDC_DECIMALS = 6;

    /// @notice MVP financing states. Active/Defaulted/Cancelled do not exist.
    enum Status {
        Created,
        Funded,
        Repaying,
        Completed
    }

    struct Position {
        address business;
        address financier;
        uint256 principal;
        uint256 obligation;
        uint256 repaid;
        uint64 createdAt;
        uint64 fundedAt;
        Status status;
    }

    /// @notice Total positions created (also the next position id).
    uint256 public positionCount;

    /// @notice positionId => Position.
    mapping(uint256 => Position) private _positions;

    event FinancingCreated(
        uint256 indexed id,
        address indexed business,
        uint256 principal,
        uint256 obligation,
        uint256 timestamp
    );
    event FinancingFunded(
        uint256 indexed id,
        address indexed financier,
        uint256 amount,
        uint256 timestamp
    );
    event RepaymentRecorded(
        uint256 indexed id,
        uint256 amount,
        uint256 totalRepaid,
        uint256 outstanding,
        uint256 timestamp
    );
    event FinancingCompleted(uint256 indexed id, uint256 timestamp);

    error ZeroBusiness();
    error ZeroAsset();
    error ZeroPrincipal();
    error ZeroObligation();
    error ObligationBelowPrincipal();
    error UnknownPosition();
    error NotCreated();
    error WrongFundingAmount();
    error NotRepayable();
    error NotBusiness();
    error ZeroAmount();
    error Overpayment();

    /**
     * @param usdc The verified single financing/repayment token. Immutable;
     * no other token is accepted by this deployment.
     */
    constructor(address usdc) {
        if (usdc == address(0)) revert ZeroAsset();
        USDC = IERC20(usdc);
    }

    /**
     * @notice Record a financing opportunity's terms onchain.
     * @param business The business address the position belongs to. Any
     * connected wallet may specify any business (open creator).
     * @param principal Financing amount in token base units. Must be > 0.
     * @param obligation Total repayment obligation in base units. Must be > 0
     * and >= principal.
     * @return id The new position id.
     */
    function create(address business, uint256 principal, uint256 obligation)
        external
        returns (uint256 id)
    {
        if (business == address(0)) revert ZeroBusiness();
        if (principal == 0) revert ZeroPrincipal();
        if (obligation == 0) revert ZeroObligation();
        if (obligation < principal) revert ObligationBelowPrincipal();

        id = positionCount;
        positionCount = id + 1;

        _positions[id] = Position({
            business: business,
            financier: address(0),
            principal: principal,
            obligation: obligation,
            repaid: 0,
            createdAt: uint64(block.timestamp),
            fundedAt: 0,
            status: Status.Created
        });

        emit FinancingCreated(id, business, principal, obligation, block.timestamp);
    }

    /**
     * @notice Fund a Created position with exactly the principal.
     * Atomic push: pulls principal from the financier (caller) and pushes it
     * straight to the business in the same transaction.
     * @param id The position to fund. Caller becomes the recorded financier.
     */
    function fund(uint256 id) external nonReentrant {
        Position storage p = _position(id);
        if (p.status != Status.Created) revert NotCreated();
        if (p.financier != address(0)) revert NotCreated();

        uint256 amount = p.principal;
        if (amount == 0) revert WrongFundingAmount();

        // Checks-effects before the external token calls.
        p.financier = msg.sender;
        p.status = Status.Funded;
        p.fundedAt = uint64(block.timestamp);

        USDC.safeTransferFrom(msg.sender, p.business, amount);

        emit FinancingFunded(id, msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Record a repayment. Only the position's business may call.
     * Atomic push: pulls the amount from the business (caller) and pushes it
     * straight to the recorded financier in the same transaction.
     * Over-repayment reverts outright (no partial cap); zero reverts.
     * @param id The position to repay.
     * @param amount Repayment amount in base units, > 0 and <= outstanding.
     */
    function repay(uint256 id, uint256 amount) external nonReentrant {
        Position storage p = _position(id);
        if (p.status != Status.Funded && p.status != Status.Repaying) revert NotRepayable();
        if (msg.sender != p.business) revert NotBusiness();
        if (amount == 0) revert ZeroAmount();

        uint256 due = p.obligation - p.repaid;
        if (amount > due) revert Overpayment();

        // Checks-effects before the external token calls.
        p.repaid = p.repaid + amount;
        if (p.status == Status.Funded) {
            p.status = Status.Repaying;
        }
        uint256 newOutstanding = p.obligation - p.repaid;
        bool completed = newOutstanding == 0;
        if (completed) {
            p.status = Status.Completed;
        }

        address financier = p.financier;
        USDC.safeTransferFrom(msg.sender, financier, amount);

        emit RepaymentRecorded(id, amount, p.repaid, newOutstanding, block.timestamp);
        if (completed) {
            emit FinancingCompleted(id, block.timestamp);
        }
    }

    /// @notice Full position record for a position id. Reverts if unknown.
    function getPosition(uint256 id) external view returns (Position memory) {
        return _position(id);
    }

    /// @notice Current outstanding balance: obligation - repaid. Computed,
    /// never stored independently, so it cannot drift.
    function outstanding(uint256 id) external view returns (uint256) {
        Position storage p = _position(id);
        return p.obligation - p.repaid;
    }

    function _position(uint256 id) internal view returns (Position storage p) {
        if (id >= positionCount) revert UnknownPosition();
        p = _positions[id];
    }
}
