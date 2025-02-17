/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import * as yup from 'yup'
import { CurrencyUtils } from '../../../utils'
import { NotEnoughFundsError } from '../../../wallet/errors'
import { ERROR_CODES, ValidationError } from '../../adapters/errors'
import { ApiNamespace, router } from '../router'

export type SendTransactionRequest = {
  fromAccountName: string
  receives: {
    publicAddress: string
    amount: string
    memo: string
  }[]
  fee: string
  expirationSequence?: number | null
  expirationSequenceDelta?: number | null
}

export type SendTransactionResponse = {
  receives: {
    publicAddress: string
    amount: string
    memo: string
  }[]
  fromAccountName: string
  hash: string
}

export const SendTransactionRequestSchema: yup.ObjectSchema<SendTransactionRequest> = yup
  .object({
    fromAccountName: yup.string().defined(),
    receives: yup
      .array(
        yup
          .object({
            publicAddress: yup.string().defined(),
            amount: yup.string().defined(),
            memo: yup.string().defined(),
          })
          .defined(),
      )
      .defined(),
    fee: yup.string().defined(),
    expirationSequence: yup.number().nullable().optional(),
    expirationSequenceDelta: yup.number().nullable().optional(),
  })
  .defined()

export const SendTransactionResponseSchema: yup.ObjectSchema<SendTransactionResponse> = yup
  .object({
    receives: yup
      .array(
        yup
          .object({
            publicAddress: yup.string().defined(),
            amount: yup.string().defined(),
            memo: yup.string().defined(),
          })
          .defined(),
      )
      .defined(),
    fromAccountName: yup.string().defined(),
    hash: yup.string().defined(),
  })
  .defined()

router.register<typeof SendTransactionRequestSchema, SendTransactionResponse>(
  `${ApiNamespace.transaction}/sendTransaction`,
  SendTransactionRequestSchema,
  async (request, node): Promise<void> => {
    const transaction = request.data

    const account = node.wallet.getAccountByName(transaction.fromAccountName)

    if (!account) {
      throw new ValidationError(`No account found with name ${transaction.fromAccountName}`)
    }

    // The node must be connected to the network first
    if (!node.peerNetwork.isReady) {
      throw new ValidationError(
        `Your node must be connected to the Iron Fish network to send a transaction`,
      )
    }

    if (!node.chain.synced) {
      throw new ValidationError(
        `Your node must be synced with the Iron Fish network to send a transaction. Please try again later`,
      )
    }

    // Check whether amount and fee are valid or not
    if (!CurrencyUtils.isValidOre(transaction.fee)) {
      throw new ValidationError(
        `Invalid transaction fee, ${transaction.fee}`,
        undefined,
        ERROR_CODES.VALIDATION,
      )
    }
    let sum = BigInt(transaction.fee)
    transaction.receives.map((receive) => {
      if (!CurrencyUtils.isValidOre(receive.amount)) {
        throw new ValidationError(
          `Invalid transaction amount, ${receive.amount}`,
          undefined,
          ERROR_CODES.VALIDATION,
        )
      }
      sum += BigInt(receive.amount)
    })

    // Check that the node account is updated
    const balance = await node.wallet.getBalance(account)

    if (balance.confirmed < sum && balance.unconfirmed < sum) {
      throw new ValidationError(
        `Your balance is too low. Add funds to your account first`,
        undefined,
        ERROR_CODES.INSUFFICIENT_BALANCE,
      )
    }

    if (balance.confirmed < sum) {
      throw new ValidationError(
        `Please wait a few seconds for your balance to update and try again`,
        undefined,
        ERROR_CODES.INSUFFICIENT_BALANCE,
      )
    }

    const receives = transaction.receives.map((receive) => {
      return {
        publicAddress: receive.publicAddress,
        amount: BigInt(receive.amount),
        memo: receive.memo,
      }
    })

    try {
      const transactionPosted = await node.wallet.pay(
        node.memPool,
        account,
        receives,
        BigInt(transaction.fee),
        transaction.expirationSequenceDelta ??
          node.config.get('defaultTransactionExpirationSequenceDelta'),
        transaction.expirationSequence,
      )

      request.end({
        receives: transaction.receives,
        fromAccountName: account.name,
        hash: transactionPosted.unsignedHash().toString('hex'),
      })
    } catch (e) {
      if (e instanceof NotEnoughFundsError) {
        throw new ValidationError(
          `Your balance changed while creating a transaction.`,
          400,
          ERROR_CODES.INSUFFICIENT_BALANCE,
        )
      }
      throw e
    }
  },
)
