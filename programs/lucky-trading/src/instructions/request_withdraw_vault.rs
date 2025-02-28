use anchor_lang::{prelude::*};
use anchor_spl::{associated_token::AssociatedToken, token::{Mint, Token, TokenAccount}, token_2022::Token2022};

use crate::{constants::constants::VAULT_SEED, error::VaultError, state::{ Vault, VaultUser}};

#[derive(Accounts)]
#[instruction(
    agent:Pubkey,
)]
pub struct RequestWithdrawVault<'info> {

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut, 
        seeds = [VAULT_SEED, agent.as_ref() ], 
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init_if_needed,
        seeds = [VAULT_SEED, vault.key().as_ref(), user.key().as_ref()],
        bump,
        payer = user,
        space = VaultUser::VAULT_USER_SPACE
    )]
    pub vault_user: Box<Account<'info, VaultUser>>,
    #[account(
        mut,
        constraint = vault.collateral == collateral.key() @VaultError::InvalidError,
    )]
    pub collateral: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = user_collateral.mint == collateral.key() @VaultError::InvalidError,
        constraint = user_collateral.owner == user.key() @VaultError::InvalidError,
    )]
    pub user_collateral: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = vault_collateral.mint == collateral.key() @VaultError::InvalidError,
        constraint = vault_collateral.owner == vault.key() @VaultError::InvalidError,
    )]
    pub vault_collateral: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(ctx: Context<RequestWithdrawVault>, agent: Pubkey, lp_amount: u64) -> Result<()> {
    let vault_user = &mut ctx.accounts.vault_user;
    vault_user.lp = vault_user.lp.checked_sub(lp_amount).ok_or(VaultError::InvalidError)?;
    vault_user.lp_lock += lp_amount;
    Ok(())
}
