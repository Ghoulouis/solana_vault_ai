use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{Mint, Token, TokenAccount}, token_2022::Token2022};

use crate::{constants::constants::VAULT_SEED, error::VaultError, helper::transfer_helper, state::{ Vault}};

#[derive(Accounts)]
pub struct WithdrawByAI<'info> {

    #[account(mut)]
    pub agent: Signer<'info>,

    #[account(
        mut, 
        seeds = [VAULT_SEED, agent.key.as_ref()], 
        bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        mut,
        constraint = vault.collateral == collateral.key() @VaultError::InvalidCollateralAccount,
    )]
    pub collateral: Box<Account<'info, Mint>>,
   
    #[account(
        mut,
        constraint = agent_collateral.mint == collateral.key() @VaultError::InvalidAICollateralATAAccount,
        constraint = agent_collateral.owner == agent.key() @VaultError::InvalidAICollateralATAAccount,
    )]
    pub agent_collateral: Box<Account<'info, TokenAccount>>,
     
    #[account(
        mut,
        constraint = vault_collateral.mint == collateral.key() @VaultError::InvalidVaultCollateralATAAccount,
        constraint = vault_collateral.owner == vault.key() @VaultError::InvalidVaultCollateralATAAccount,
    )]
    pub vault_collateral: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(ctx: Context<WithdrawByAI>,  collateral_amount: u64) -> Result<()> {
   let collateral = &mut ctx.accounts.collateral;
    let vault = &mut ctx.accounts.vault;
    transfer_helper(ctx.accounts.vault_collateral.to_account_info(),
     ctx.accounts.agent_collateral.to_account_info(),
     collateral,
     vault.to_account_info(),
     ctx.accounts.token_program.to_account_info(),
     ctx.accounts.token_2022_program.to_account_info(),
     collateral_amount,
     Some(&[&[VAULT_SEED, ctx.accounts.agent.key().as_ref(), &[vault.bump] ]]),
    )?;

    let vault = &mut ctx.accounts.vault;
    vault.collateral_amount = vault.collateral_amount.checked_sub(collateral_amount).ok_or(VaultError::InvalidCollateralAmount)?;

    
    Ok(())
}
