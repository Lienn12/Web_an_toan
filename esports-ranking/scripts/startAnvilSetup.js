import { ethers } from "ethers";
import { getWalletFromDB, getAllTeamWallets } from "../src/services/UserService.js";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

dotenv.config();

const RPC_URL = process.env.RPC_URL || "http://183.81.33.178:8545";
const MAX_RETRIES = 20;      // số lần retry nếu Anvil chưa sẵn sàng
const RETRY_DELAY_MS = 1000; // delay giữa các lần retry

// Hàm retry kết nối Anvil
async function waitForAnvil(rpcUrl, retries = MAX_RETRIES, delayMs = RETRY_DELAY_MS) {
  for (let i = 0; i < retries; i++) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      await provider.getBlockNumber(); // thử gọi RPC
      console.log(`Connected to Anvil at ${rpcUrl}`);
      return provider;
    } catch (err) {
      console.log(`Waiting for Anvil RPC... retry ${i + 1}/${retries}`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error(`Cannot connect to Anvil at ${rpcUrl} after ${retries} retries`);
}

async function startFullNode() {
  console.log("Setting up Anvil full node...");

  try {
    //Kết nối provider với retry
    const provider = await waitForAnvil(RPC_URL);

    //Lấy admin + team wallets từ DB
    const admin = await getWalletFromDB(process.env.ADMIN_USERNAME);
    const teams = await getAllTeamWallets();
    const allWallets = [admin, ...teams];
    console.log(`Found ${allWallets.length} wallets`);

    //Impersonate accounts trên Anvil
    console.log("\nStep 1: Impersonating accounts...");
    for (const wallet of allWallets) {
      await provider.send("anvil_impersonateAccount", [wallet.address]);
      console.log(`  ✓ Impersonated: ${wallet.address}`);
    }

    //Set balance cho tất cả accounts
    console.log("\nStep 2: Funding accounts...");
    const hexBalance = "0x" + ethers.parseEther("1000000000000").toString(16); // 1000000000000 ETH
    for (const wallet of allWallets) {
      await provider.send("anvil_setBalance", [wallet.address, hexBalance]);
      const balance = await provider.getBalance(wallet.address);
      console.log(`Funded ${wallet.address}: ${ethers.formatEther(balance)} ETH`);
    }

    //Deploy contract bằng admin wallet
    console.log("\nStep 3: Deploying Leaderboard contract...");
    const artifactPath = path.resolve("./artifacts/contracts/Leaderboard.sol/Leaderboard.json");
    const artifactRaw = await fs.readFile(artifactPath, "utf8");
    const LeaderboardArtifact = JSON.parse(artifactRaw);

    const adminSigner = new ethers.Wallet(admin.privateKey, provider);

    const LeaderboardFactory = new ethers.ContractFactory(
      LeaderboardArtifact.abi,
      LeaderboardArtifact.bytecode,
      adminSigner
    );

    const leaderboard = await LeaderboardFactory.deploy();
    await leaderboard.waitForDeployment();
    const contractAddress = await leaderboard.getAddress();
    console.log(`Leaderboard deployed at: ${contractAddress}`);

    //In thông tin import vào MetaMask
    console.log("\n" + "=".repeat(80));
    console.log("SETUP COMPLETED! MetaMask configuration:");
    console.log(`RPC URL: ${RPC_URL}`);
    console.log(`Chain ID: 1337`);
    console.log("\nAccounts to import (copy private keys):");
    allWallets.forEach((wallet, index) => {
      console.log(`\n${index === 0 ? "ADMIN" : `TEAM ${index}`}:`);
      console.log(`  Address: ${wallet.address}`);
      console.log(`  Private Key: ${wallet.privateKey}`);
    });
    console.log("=".repeat(80));

    //Lưu thông tin deployment
    const deploymentData = {
      leaderboard: contractAddress,
      network: "anvil-local",
      rpcUrl: RPC_URL,
      chainId: 1337,
      accounts: allWallets.map(w => ({
        address: w.address,
        role: w.address === admin.address ? "admin" : "team"
      })),
      deployedAt: new Date().toISOString()
    };
    await fs.writeFile("./deployments.json", JSON.stringify(deploymentData, null, 2));
    console.log("Deployment info saved to deployments.json");

    return { contractAddress, accounts: allWallets.length };

  } catch (err) {
    console.error("Script failed:", err);
    process.exit(1);
  }
}

// Chạy script
startFullNode()
  .then(result => {
    console.log("\nScript completed successfully");
    console.log(`Contract: ${result.contractAddress}`);
    console.log(`Accounts setup: ${result.accounts}`);
  });
