import { use } from "chai";
import * as anchor from "@coral-xyz/anchor";
// import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, clusterApiUrl, PublicKey, Keypair } from "@solana/web3.js";
import idl from "../target/idl/lucky_trading.json"; // File IDL của chương trình

import { Program } from "@project-serum/anchor";
import { LuckyTrading } from "../target/types/lucky_trading";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
const VAULT_SEED = "vault";
import * as dotenv from "dotenv";
import { AnchorProvider } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
dotenv.config();

async function main() {
    const privateKeyBytes = bs58.decode(process.env.PRIVATE_KEY!);
    const keypair = Keypair.fromSecretKey(new Uint8Array(privateKeyBytes));
    const wallet = new anchor.Wallet(keypair);

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
    });

    const program = new Program(idl as LuckyTrading, "ATnAJWbLWJHc3qCb7ai4cSiWgaUFXqMhmZs7qQfSHxsX", provider);
    const agent = new PublicKey("Gg9UvaXUTwJvPXZN3rmjmBeGiU4FwQQf7q43aWH2uDMX");

    const vaultPda = PublicKey.findProgramAddressSync(
        [Buffer.from(VAULT_SEED), agent.toBuffer()],
        program.programId
    )[0];

    const collateral = new PublicKey("Bv773jeAs3nsU9NnUM8pYWAXsggqp2NCtpuMzSS3E1fg");
    const amount = new anchor.BN(0);
    let [vaultUserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), vaultPda.toBuffer(), wallet.publicKey.toBuffer()],
        program.programId
    );
    let userCollateralATA = await getAssociatedTokenAddress(collateral, wallet.publicKey);
    let vaultCollateralATA = await getAssociatedTokenAddress(collateral, vaultPda, true);
    console.log("vaultCollateralATA", vaultCollateralATA.toBase58());
    try {
        console.log("user", wallet.publicKey.toBase58());
        console.log("vault", vaultPda.toBase58());
        console.log("collateral", collateral.toBase58());
        console.log("amount", amount.toString());
        console.log("vaultUserPda", vaultUserPda.toBase58());
        console.log("userCollateralATA", userCollateralATA.toBase58());
        console.log("vaultCollateralATA", vaultCollateralATA.toBase58());

        let tx = await program.methods
            .requestWithdraw(agent, amount)
            .accounts({
                user: wallet.publicKey,
                vault: vaultPda,
                collateral: collateral,
                vaultUser: vaultUserPda,
                userCollateral: userCollateralATA,
                vaultCollateral: vaultCollateralATA,
                token2022Program: TOKEN_2022_PROGRAM_ID,
            })
            .signers([wallet.payer])
            .rpc();
        console.log("tx", tx);
    } catch (err) {
        console.error("Không thể lấy dữ liệu vault:", err);
    }
}
main().catch((err) => {
    console.error("Lỗi:", err);
});
