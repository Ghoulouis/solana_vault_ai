import {
    Account,
    createAssociatedTokenAccount,
    createMint,
    getAccount,
    getAssociatedTokenAddress,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { AnchorError, Program, Wallet } from "@coral-xyz/anchor";

import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { assert, expect, use } from "chai";
import { getBalanceLPLockUser, getBalanceLPUser, getTotalLP } from "../case/utils";
import { LuckyTrading } from "../../target/types/lucky_trading";
import * as anchor from "@coral-xyz/anchor";
export const requestWithdrawTest = async function ({ owner, user }: { owner: Wallet; user: Wallet }) {
    const program = anchor.workspace.LuckyTrading as Program<LuckyTrading>;
    const provider = anchor.AnchorProvider.env();
    let collateral: PublicKey;
    let anotherCollateral: PublicKey;
    let userCollateralATA: PublicKey;
    let vaultCollateralATA: PublicKey;
    let agentCollateralATA: PublicKey;
    let vault: PublicKey;
    let vaultUserPda: PublicKey;
    let collateralDecimals = 6;
    let anotherUser = new anchor.Wallet(anchor.web3.Keypair.generate());
    let anotherUserCollateralATA: PublicKey;
    let agent = new anchor.Wallet(anchor.web3.Keypair.generate());
    let anotherVault: PublicKey;
    let anotherVaultUserPda: PublicKey;
    return describe("Request Withdraw Tests", function () {
        before("Initialize collateral", async function () {
            const airdropSig = await provider.connection.requestAirdrop(anotherUser.publicKey, 100 * LAMPORTS_PER_SOL);
            await provider.connection.confirmTransaction(airdropSig);
            const airdropSig2 = await provider.connection.requestAirdrop(agent.publicKey, 100 * LAMPORTS_PER_SOL);
            await provider.connection.confirmTransaction(airdropSig2);
            collateral = await createMint(
                provider.connection,
                {
                    publicKey: owner.payer.publicKey,
                    secretKey: owner.payer.secretKey,
                },
                owner.payer.publicKey,
                owner.payer.publicKey,
                6
            );

            userCollateralATA = (
                await getOrCreateAssociatedTokenAccount(provider.connection, user.payer, collateral, user.publicKey)
            ).address;

            anotherUserCollateralATA = await getAssociatedTokenAddress(collateral, anotherUser.publicKey);

            agentCollateralATA = await getAssociatedTokenAddress(collateral, agent.publicKey, true);

            await mintTo(
                provider.connection,
                owner.payer,
                collateral,
                userCollateralATA,
                owner.payer.publicKey,
                1e6 * 10 ** collateralDecimals
            );

            [vault] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), agent.publicKey.toBuffer()],
                program.programId
            );

            [vaultUserPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), vault.toBuffer(), user.publicKey.toBuffer()],
                program.programId
            );

            vaultCollateralATA = await getAssociatedTokenAddress(collateral, vault, true);
            agentCollateralATA = await getAssociatedTokenAddress(collateral, agent.publicKey);
            await program.methods
                .openVault()
                .accounts({
                    authority: owner.publicKey,
                    agent: agent.publicKey,
                    collateral: collateral,
                    vault: vault,
                    agentCollateral: agentCollateralATA,
                    vaultCollateral: vaultCollateralATA,
                    token2022Program: TOKEN_2022_PROGRAM_ID,
                })
                .signers([owner.payer])
                .rpc();
            const vaultOnChain = await program.account.vault.fetch(vault);
            expect(vaultOnChain.authority).to.eql(owner.publicKey);

            let amount = 5e5 * 10 ** collateralDecimals;
            let amountLp = 5e5 * 10 ** collateralDecimals;

            await program.methods
                .deposit(new anchor.BN(amount), new anchor.BN(amountLp), new anchor.BN(0))
                .accounts({
                    agent: agent.publicKey,
                    user: user.publicKey,
                    vault: vault,
                    vaultUser: vaultUserPda,
                    collateral: collateral,
                    userCollateral: userCollateralATA,
                    vaultCollateral: vaultCollateralATA,
                    token2022Program: TOKEN_2022_PROGRAM_ID,
                })
                .signers([user.payer, agent.payer])
                .rpc();
        });

        it("failds when use another user's collateral ATA", async function () {});

        it("failds when use another collateral ATA", async function () {});

        it("failds when use another signer compare agent", async function () {});

        it("succeed user can deposit to vault", async function () {
            let amountLPRequestWithdraw = 1e5 * 10 ** collateralDecimals;

            let data = await program.account.vaultUser.fetch(vaultUserPda);

            let amountLpBefore = data.lp;
            let amountLPLockBefore = data.lpLock;

            await program.methods
                .requestWithdraw(agent.publicKey, new anchor.BN(amountLPRequestWithdraw))
                .accounts({
                    user: user.publicKey,
                    vault: vault,
                    vaultUser: vaultUserPda,
                    collateral: collateral,
                    userCollateral: userCollateralATA,
                    vaultCollateral: vaultCollateralATA,
                    token2022Program: TOKEN_2022_PROGRAM_ID,
                })
                .signers([user.payer])
                .rpc();

            let dataAfter = await program.account.vaultUser.fetch(vaultUserPda);
            let amountLpAfter = dataAfter.lp;
            let amountLPLockAfter = dataAfter.lpLock;

            expect(amountLpBefore.sub(new anchor.BN(amountLPRequestWithdraw)).toString()).to.eql(
                amountLpAfter.toString()
            );

            expect(amountLPLockBefore.add(new anchor.BN(amountLPRequestWithdraw)).toString()).to.eql(
                amountLPLockAfter.toString()
            );
        });
    });
};
