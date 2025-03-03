use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{Mint, Token, TokenAccount}, token_2022::Token2022};

use crate::{constants::constants::VAULT_SEED, error::VaultError, helper::transfer_helper, state::{ Vault, VaultUser}};

#[derive(Accounts)]
pub struct Deposit<'info> {

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub agent: Signer<'info>,

    #[account(
        mut, 
        seeds = [VAULT_SEED, agent.key.as_ref() ], 
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
        constraint = vault.collateral == collateral.key() @VaultError::InvalidCollateral,
    )]
    pub collateral: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = user_collateral.mint == collateral.key() @VaultError::InvalidCollateralUserCollateralATA,
        constraint = user_collateral.owner == user.key() @VaultError::InvalidOwnerUserCollateralATA,
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

impl <'info> Deposit<'info> {
        pub fn handler(&mut self, collateral_amount: u64, lp_amount: u64, nonce : u64) -> Result<()> {
        let collateral =&mut self.collateral;
        let user =&mut self.user;
        let vault =&mut self.vault; 
        let vault_user =&mut self.vault_user;

        require!(vault.nonce == nonce, VaultError::InvalidError);
        vault.nonce += 1;

        transfer_helper(self.user_collateral.to_account_info(), self.vault_collateral.to_account_info(),
        collateral,
        user.to_account_info(),
        self.token_program.to_account_info(),
        self.token_2022_program.to_account_info(),
        collateral_amount,
        None
        )?;
        vault.total_lp += lp_amount;
        vault.collateral_amount += collateral_amount;
        vault_user.lp += lp_amount;
        Ok(())
    }

}
