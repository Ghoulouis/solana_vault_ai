import { PublicKey } from "@solana/web3.js";
import { LuckyTrading } from "../../target/types/lucky_trading";
import { Program } from "@coral-xyz/anchor";
import { getAccount, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
const program = anchor.workspace.LuckyTrading as Program<LuckyTrading>;
const provider = anchor.AnchorProvider.env();

export async function getOrCreateATA(signer: anchor.Wallet, pubicKey: PublicKey, collateral: PublicKey) {
    return await getOrCreateAssociatedTokenAccount(provider.connection, signer.payer, collateral, pubicKey, true);
}

export async function getBalanceVault(vaultPda: PublicKey, collateral: PublicKey, signer: anchor.Wallet) {
    let [vault] = PublicKey.findProgramAddressSync([Buffer.from("vault"), vaultPda.toBuffer()], program.programId);

    let vaultATA = await getOrCreateATA(signer, vault, collateral);

    let balanceBefore = await getAccount(provider.connection, vaultATA.address);

    return balanceBefore.amount;
}
