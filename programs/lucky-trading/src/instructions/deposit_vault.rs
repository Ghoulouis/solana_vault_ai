use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{Mint, Token, TokenAccount}, token_2022::Token2022};

use crate::{constants::constants::VAULT_SEED, error::VaultError, helper::transfer_helper, state::{vault, Vault, VaultUser}};

#[derive(Accounts)]
pub struct DepositVault<'info> {

    #[account(mut)]
    pub ai: Signer<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut, 
        seeds = [VAULT_SEED, ai.key.as_ref() ], 
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

pub(crate) fn handler(ctx: Context<DepositVault>, collateral_amount: u64, lp_amount: u64, nonce : u64) -> Result<()> {
   let collateral = &ctx.accounts.collateral;
    let user = &ctx.accounts.user;
    let vault = &mut ctx.accounts.vault; 

    require!(vault.nonce == nonce, VaultError::InvalidError);
    vault.nonce += 1;

    // transfer
    transfer_helper(ctx.accounts.user_collateral.to_account_info(),
     ctx.accounts.vault_collateral.to_account_info(),
     collateral,
     user.to_account_info(),
     ctx.accounts.token_program.to_account_info(),
     ctx.accounts.token_2022_program.to_account_info(),
     collateral_amount,
     None
    )?;
    

    vault.total_lp += lp_amount;
    let vault_user = &mut ctx.accounts.vault_user;
    vault_user.lp += lp_amount;

    
    Ok(())
}
