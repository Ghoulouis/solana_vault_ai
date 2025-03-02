#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

use crate::instructions::*;

pub mod constants;
pub mod error;
pub mod helper;
pub mod instructions;
pub mod state;

declare_id!("ATnAJWbLWJHc3qCb7ai4cSiWgaUFXqMhmZs7qQfSHxsX");

#[program]
pub mod lucky_trading {
    use super::*;

    // admin functions

    pub fn open_vault(ctx: Context<OpenVault>, agent: Pubkey) -> Result<()> {
        ctx.accounts.handler(agent, ctx.bumps.vault)
    }

    pub fn close_vault(ctx: Context<CloseVault>, agent: Pubkey) -> Result<()> {
        ctx.accounts.handler(agent)
    }

    // agent functions

    pub fn deposit_by_ai(ctx: Context<DepositByAI>, collateral_amount: u64) -> Result<()> {
        ctx.accounts.handler(collateral_amount)
    }

    pub fn withdraw_by_ai(ctx: Context<WithdrawByAI>, collateral_amount: u64) -> Result<()> {
        ctx.accounts.handler(collateral_amount)
    }

    pub fn withdraw_for_user(
        ctx: Context<WithdrawForUser>,
        user: Pubkey,
        lp_amount: u64,
        collateral_amount: u64,
    ) -> Result<()> {
        ctx.accounts.handler(user, lp_amount, collateral_amount)
    }

    // user function

    pub fn deposit(
        ctx: Context<Deposit>,
        collateral_amount: u64,
        lp_amount: u64,
        nonce: u64,
    ) -> Result<()> {
        ctx.accounts.handler(collateral_amount, lp_amount, nonce)
    }

    pub fn request_withdraw(
        ctx: Context<RequestWithdraw>,
        agent: Pubkey,
        lp_amount: u64,
    ) -> Result<()> {
        ctx.accounts.handler(agent, lp_amount)
    }
}
