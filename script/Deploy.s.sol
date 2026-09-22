// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {KobyFinancing} from "../src/KobyFinancing.sol";

/**
 * Deploy KobyFinancing to Monad Testnet.
 *
 *   USDC_ADDRESS=0x... forge script script/Deploy.s.sol:Deploy \
 *     --rpc-url $MONAD_TESTNET_RPC --broadcast
 *
 * USDC_ADDRESS must be the re-verified testnet asset address
 * (docs/MONAD.md Section 11). Never invent it; the script refuses to run
 * without it. Deployer needs testnet MON for gas only.
 */
contract Deploy is Script {
    function run() external returns (KobyFinancing) {
        address usdc = vm.envAddress("USDC_ADDRESS");
        require(usdc != address(0), "USDC_ADDRESS required");
        vm.startBroadcast();
        KobyFinancing koby = new KobyFinancing(usdc);
        vm.stopBroadcast();
        console.log("KobyFinancing deployed at:", address(koby));
        console.log("USDC asset:", usdc);
        return koby;
    }
}
