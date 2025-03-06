// import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, clusterApiUrl, PublicKey, Keypair } from "@solana/web3.js";
import idl from "../target/idl/lucky_trading.json"; // File IDL của chương trình
import { LuckyTrading } from "../target/types/lucky_trading";
import { AnchorProvider, Program, Wallet } from "@project-serum/anchor";
import keypair from "../deploy_key_mainnet.json";
import { getAssociatedTokenAddress, getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
const VAULT_SEED = "vault";
async function main() {
    const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
    const wallet = new Wallet(Keypair.fromSecretKey(Uint8Array.from(keypair)));
    const provider = new AnchorProvider(connection, wallet, {
        preflightCommitment: "confirmed",
        commitment: "confirmed",
    });
    const program = new Program(idl as LuckyTrading, "ATnAJWbLWJHc3qCb7ai4cSiWgaUFXqMhmZs7qQfSHxsX", provider);

    const agent = new PublicKey("FaLzHHk1NkwPNCh5FFqEWV4e7zaXrCCBn1UL2VBUB8fE"); // Agent
    const collateral = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // USDC mainnet

    let agentCollateralATA = await getAssociatedTokenAddress(collateral, agent);

    const vaultPda = PublicKey.findProgramAddressSync(
        [Buffer.from(VAULT_SEED), agent.toBuffer()],
        program.programId
    )[0];
    let isDeployed = false;
    try {
        let data = await program.account.vault.fetch(vaultPda);
        isDeployed = true;
        console.log("Vault is already deployed at", vaultPda.toBase58());
    } catch {}
    console.log("isDeployed = ", false);
    if (isDeployed) return;
    const vaultCollatetalATA = getAssociatedTokenAddressSync(collateral, vaultPda, true);
    console.log(" Running");
    const txHash = await program.methods
        .openVault()
        .accounts({
            authority: wallet.publicKey,
            agent: agent,
            collateral: collateral,
            vault: vaultPda,
            vaultCollateral: vaultCollatetalATA,
            agentCollateral: agentCollateralATA,
            token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .signers([wallet.payer])
        .rpc();

    console.log("Transaction hash:", txHash);

    console.log(`View transaction on Solana Explorer: https://solscan.io/tx/${txHash}`);
}

main().catch((err) => {
    console.error("Lỗi:", err);
});
