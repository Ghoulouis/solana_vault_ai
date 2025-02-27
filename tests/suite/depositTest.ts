import * as anchor from "@coral-xyz/anchor";
import {
    Account,
    createAssociatedTokenAccount,
    createMint,
    getAccount,
    getOrCreateAssociatedTokenAccount,
    mintTo,
} from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import { LuckyTrading } from "../../target/types/lucky_trading";
import { PublicKey } from "@solana/web3.js";
import { assert, expect, use } from "chai";
import { getBalanceLPUser, getTotalLP } from "../case/utils";
export const depositTest = async function ({
    owner,
    agent,
    user,
}: {
    owner: anchor.Wallet;
    agent: anchor.Wallet;
    user: anchor.Wallet;
}) {
    const program = anchor.workspace.LuckyTrading as Program<LuckyTrading>;
    const provider = anchor.AnchorProvider.env();
    let collateral: PublicKey;
    let userCollateralATA: PublicKey;
    let vaultCollateralATA: Account;
    let agentCollateralATA: Account;
    let vault: PublicKey;
    let collateralDecimals = 6;

    return describe("Deposit tests", function () {
        before("Initialize collateral", async function () {
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

            userCollateralATA = await createAssociatedTokenAccount(
                provider.connection,
                user.payer,
                collateral,
                user.publicKey
            );

            agentCollateralATA = await getOrCreateAssociatedTokenAccount(
                provider.connection,
                agent.payer,
                collateral,
                agent.publicKey,
                true
            );

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

            vaultCollateralATA = await getOrCreateAssociatedTokenAccount(
                provider.connection,
                owner.payer,
                collateral,
                vault,
                true
            );

            await program.methods
                .openVault()
                .accountsPartial({
                    authority: owner.publicKey,
                    ai: agent.publicKey,
                    collateral: collateral,
                    vault: vault,
                })
                .signers([owner.payer, agent.payer])
                .rpc();
            const vaultOnChain = await program.account.vault.fetch(vault);
            expect(vaultOnChain.authority).to.eql(owner.publicKey);
        });
        it("can deposit to vault", async function () {
            let amount = 5e5 * 10 ** collateralDecimals;
            let amountLp = 5e5 * 10 ** collateralDecimals;
            await program.methods
                .deposit(new anchor.BN(amount), new anchor.BN(amountLp), new anchor.BN(0))
                .accountsPartial({
                    ai: agent.publicKey,
                    user: user.publicKey,
                    vault: vault,
                    collateral: collateral,
                    userCollateral: userCollateralATA,
                    vaultCollateral: vaultCollateralATA.address,
                })
                .signers([user.payer, agent.payer])
                .rpc();
            console;
            let balanceLP = await getBalanceLPUser(user.publicKey, vault);
            expect(balanceLP).to.eq(BigInt(amountLp));

            let totalLP = await getTotalLP(vault);
            expect(totalLP).to.eq(BigInt(amountLp));
        });

        it("agent can withdraw from vault", async function () {
            let amount = new anchor.BN(1e5 * 10 ** collateralDecimals);
            let balanceBefore = await getAccount(provider.connection, agentCollateralATA.address);
            await program.methods
                .withdrawByAi(amount)
                .accountsPartial({
                    ai: agent.publicKey,
                    vault: vault,
                    collateral: collateral,
                    aiCollateral: agentCollateralATA.address,
                    vaultCollateral: vaultCollateralATA.address,
                })
                .signers([agent.payer])
                .rpc();
            let balanceAfter = await getAccount(provider.connection, agentCollateralATA.address);
            expect(balanceAfter.amount - balanceBefore.amount).to.eq(BigInt(1e5 * 10 ** collateralDecimals));
        });

        it("agent can deposit to vault", async function () {
            let amount = new anchor.BN(1e5 * 10 ** collateralDecimals);
            let balanceBefore = await getAccount(provider.connection, agentCollateralATA.address);
            await program.methods
                .depositByAi(amount)
                .accountsPartial({
                    ai: agent.publicKey,
                    vault: vault,
                    collateral: collateral,
                    aiCollateral: agentCollateralATA.address,
                    vaultCollateral: vaultCollateralATA.address,
                })
                .signers([agent.payer])
                .rpc();
            let balanceAfter = await getAccount(provider.connection, agentCollateralATA.address);
            expect(balanceBefore.amount - balanceAfter.amount).to.eq(BigInt(1e5 * 10 ** collateralDecimals));
        });
    });
};
