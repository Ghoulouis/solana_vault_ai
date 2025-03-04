import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor"; // Import đầy đủ anchor
import { Program } from "@coral-xyz/anchor";
import { LuckyTrading } from "../target/types/lucky_trading";
import {
    createAssociatedTokenAccount,
    getAssociatedTokenAddressSync,
    getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

const VAULT_SEED = "vault";

async function main() {
    // Thiết lập provider và program
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.LuckyTrading as Program<LuckyTrading>;
    const wallet = anchor.Wallet.local();

    const agent = new PublicKey("4xDfHSD5ac6sSSgNEUjU35tGnWuQCuzc9iUNNE4aNe1u");
    const collateral = new PublicKey("Bv773jeAs3nsU9NnUM8pYWAXsggqp2NCtpuMzSS3E1fg"); // USDC devnet
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

    const txHash = await program.methods
        .openVault(agent)
        .accounts({
            authority: wallet.publicKey,
            collateral: collateral,
            vault: vaultPda,
            vaultCollateral: vaultCollatetalATA,
        })
        .signers([wallet.payer])
        .rpc();

    console.log("Transaction hash:", txHash);

    console.log(`View transaction on Solana Explorer: https://solscan.io/tx/${txHash}?cluster=devnet`);
}

main().catch((err) => {
    console.error("Error:", err);
});
