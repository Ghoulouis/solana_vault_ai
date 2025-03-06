import { Keypair, PublicKey } from "@solana/web3.js";
import { LuckyTrading } from "../target/types/lucky_trading";
import {
    createAssociatedTokenAccount,
    getAssociatedTokenAddress,
    getAssociatedTokenAddressSync,
    getOrCreateAssociatedTokenAccount,
    TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import keypair from "../deploy_key_mainnet.json";
import { AnchorProvider, Program } from "@project-serum/anchor";
const VAULT_SEED = "vault";

async function main() {
    // Thiết lập provider và program
    const providerDefault = anchor.AnchorProvider.env();
    const wallet = new anchor.Wallet(Keypair.fromSecretKey(Uint8Array.from(keypair)));
    const provider = new AnchorProvider(providerDefault.connection, wallet, {
        commitment: "confirmed",
    });
    //anchor.setProvider(provider);
    const program = anchor.workspace.LuckyTrading as Program<LuckyTrading>;

    console.log("Wallet address:", provider.publicKey.toBase58());
    console.log("Wallet public key:", wallet.publicKey.toBase58());

    let balance = await provider.connection.getBalance(wallet.publicKey);
    console.log("Balance:", balance / 10 ** 9, "SOL");

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
    console.error("Error:", err);
});
