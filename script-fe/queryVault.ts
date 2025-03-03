import * as anchor from "@coral-xyz/anchor";
// import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
import idl from "../target/idl/lucky_trading.json"; // File IDL của chương trình
import { LuckyTrading } from "../target/types/lucky_trading";
import { Program } from "@project-serum/anchor";
const VAULT_SEED = "vault";
async function main() {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const provider = new anchor.AnchorProvider(connection, null, {
        preflightCommitment: "confirmed",
        commitment: "confirmed",
    });
    const program = new Program(idl as LuckyTrading, "ATnAJWbLWJHc3qCb7ai4cSiWgaUFXqMhmZs7qQfSHxsX", provider);
    const agent = new PublicKey("Gg9UvaXUTwJvPXZN3rmjmBeGiU4FwQQf7q43aWH2uDMX");
    const vaultPda = PublicKey.findProgramAddressSync(
        [Buffer.from(VAULT_SEED), agent.toBuffer()],
        program.programId
    )[0];
    try {
        const vaultAccount = await program.account.vault.fetch(vaultPda);
        console.log("Vault Account: ", vaultPda.toBase58());
        console.log("      authority: ", vaultAccount.authority.toBase58());
        console.log("      agent: ", vaultAccount.agent.toBase58());
        console.log("      total collateral: ", vaultAccount.collateralAmount.toString());
        console.log("      total LP: ", vaultAccount.totalLp.toString());
    } catch (err) {
        console.error("Không thể lấy dữ liệu vault:", err);
    }
    console.log("Program ID:", program.programId.toBase58());
    console.log("Kết nối thành công tới:", clusterApiUrl("devnet"));
}

main().catch((err) => {
    console.error("Lỗi:", err);
});
