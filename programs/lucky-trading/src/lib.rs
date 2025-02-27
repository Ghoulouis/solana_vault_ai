use anchor_lang::prelude::*;

use crate::instructions::*;
use crate::state::*;

pub mod constants;
pub mod error;
pub mod helper;
pub mod instructions;
pub mod state;

declare_id!("6u3ArNty9HRsBnfh7nZZTSUsWfzLqPKscwPtuQhXkkT2");

#[program]
pub mod lucky_trading {
    use super::*;

    // admin functions
    pub fn open_vault(ctx: Context<OpenVault>) -> Result<()> {
        instructions::open_vault::handler(ctx)
    }

    pub fn close_vault(ctx: Context<CloseVault>) -> Result<()> {
        instructions::close_vault::handler(ctx)
    }

    // ai functions

    pub fn deposit_by_ai(ctx: Context<DepositByAI>, collateral_amount: u64) -> Result<()> {
        instructions::deposit_by_ai::handler(ctx, collateral_amount)
    }

    pub fn withdraw_by_ai(ctx: Context<WithdrawByAI>, collateral_amount: u64) -> Result<()> {
        instructions::withdraw_by_ai::handler(ctx, collateral_amount)
    }

    pub fn withdraw_for_user(
        ctx: Context<WithdrawVault>,
        user: Pubkey,
        lp_amount: u64,
        collateral_amount: u64,
    ) -> Result<()> {
        instructions::withdraw_vault::handler(ctx, user, lp_amount, collateral_amount)
    }
    // user function

    pub fn deposit(
        ctx: Context<DepositVault>,
        collateral_amount: u64,
        lp_amount: u64,
        nonce: u64,
    ) -> Result<()> {
        instructions::deposit_vault::handler(ctx, collateral_amount, lp_amount, nonce)
    }

    pub fn request_withdraw(
        ctx: Context<RequestWithdrawVault>,
        ai_key: Pubkey,
        lp_amount: u64,
    ) -> Result<()> {
        instructions::request_withdraw_vault::handler(ctx, ai_key, lp_amount)
    }
}
