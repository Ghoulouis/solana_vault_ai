use anchor_lang::prelude::AccountInfo;
use anchor_lang::{prelude::*, system_program};
use anchor_spl::token::{self, Mint};
use anchor_spl::token_2022;

use crate::error::VaultError;
pub fn transfer_helper<'info>(
    from_account_info: AccountInfo<'info>,
    to_account_info: AccountInfo<'info>,
    mint: &Box<Account<'info, Mint>>,
    authority_account_info: AccountInfo<'info>,
    token_program: AccountInfo<'info>,
    token_2022_program: AccountInfo<'info>,
    amount: u64,
    signer_seeds: Option<&[&[&[u8]]]>,
) -> Result<()> {
    if amount == 0 {
        return Ok(());
    }
    if authority_account_info.owner != &system_program::ID && !signer_seeds.is_some() {
        return Err(VaultError::InvalidOwnerTransfer.into());
    }
    let mut token_program_info = token_program;
    let mint_account_info = mint.to_account_info();

    if from_account_info.owner == token_2022_program.key {
        token_program_info = token_2022_program;
        let cpi = if authority_account_info.owner != &system_program::ID && signer_seeds.is_some() {
            CpiContext::new_with_signer(
                token_program_info,
                token_2022::TransferChecked {
                    from: from_account_info,
                    to: to_account_info,
                    authority: authority_account_info,
                    mint: mint_account_info,
                },
                signer_seeds.unwrap(),
            )
        } else {
            CpiContext::new(
                token_program_info,
                token_2022::TransferChecked {
                    from: from_account_info,
                    to: to_account_info,
                    authority: authority_account_info,
                    mint: mint_account_info,
                },
            )
        };

        token_2022::transfer_checked(cpi, amount, mint.decimals)?;
    } else {
        let cpi = if authority_account_info.owner != &system_program::ID && signer_seeds.is_some() {
            CpiContext::new_with_signer(
                token_program_info,
                token::Transfer {
                    from: from_account_info,
                    to: to_account_info,
                    authority: authority_account_info,
                },
                signer_seeds.unwrap(),
            )
        } else {
            CpiContext::new(
                token_program_info,
                token::Transfer {
                    from: from_account_info,
                    to: to_account_info,
                    authority: authority_account_info,
                },
            )
        };

        token::transfer(cpi, amount)?;
    }
    Ok(())
}
