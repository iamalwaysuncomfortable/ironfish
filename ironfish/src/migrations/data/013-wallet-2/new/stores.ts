/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import {
  BigIntLEEncoding,
  BufferEncoding,
  IDatabase,
  NULL_ENCODING,
  NullableBufferEncoding,
  PrefixEncoding,
  StringEncoding,
  U32_ENCODING,
} from '../../../../storage'
import { AccountsStore, AccountValue, AccountValueEncoding } from './accounts'
import { BalancesStore } from './balances'
import { DecryptedNotesStore, DecryptedNoteValueEncoding } from './decryptedNotes'
import { HeadHashesStore } from './headHashes'
import { AccountsDBMeta, MetaStore, MetaValueEncoding } from './meta'
import { NonChainNoteHashesStore } from './nonChainNoteHashes'
import { NullifierToNoteHashStore } from './nullifierToNoteHash'
import { PendingTransactionHashesStore } from './pendingTransactionHashes'
import { SequenceToNoteHashStore } from './sequenceToNoteHash'
import { TransactionsStore, TransactionValueEncoding } from './transactions'

export type NewStores = {
  meta: MetaStore
  accounts: AccountsStore
  nullifierToNoteHash: NullifierToNoteHashStore
  transactions: TransactionsStore
  headHashes: HeadHashesStore
  decryptedNotes: DecryptedNotesStore
  balances: BalancesStore
  nonChainNoteHashes: NonChainNoteHashesStore
  sequenceToNoteHash: SequenceToNoteHashStore
  pendingTransactionHashes: PendingTransactionHashesStore
}

export function loadNewStores(db: IDatabase): NewStores {
  const meta: MetaStore = db.addStore({
    name: 'm',
    keyEncoding: new StringEncoding<keyof AccountsDBMeta>(),
    valueEncoding: new MetaValueEncoding(),
  })

  const headHashes: HeadHashesStore = db.addStore({
    name: 'h',
    keyEncoding: new StringEncoding(),
    valueEncoding: new NullableBufferEncoding(),
  })

  const accounts: AccountsStore = db.addStore<{ key: string; value: AccountValue }>({
    name: 'a',
    keyEncoding: new StringEncoding(),
    valueEncoding: new AccountValueEncoding(),
  })

  const balances: BalancesStore = db.addStore<{ key: string; value: bigint }>({
    name: 'b',
    keyEncoding: new StringEncoding(),
    valueEncoding: new BigIntLEEncoding(),
  })

  const decryptedNotes: DecryptedNotesStore = db.addStore({
    name: 'd',
    keyEncoding: new PrefixEncoding(new BufferEncoding(), new BufferEncoding(), 4),
    valueEncoding: new DecryptedNoteValueEncoding(),
  })

  const nullifierToNoteHash: NullifierToNoteHashStore = db.addStore({
    name: 'n',
    keyEncoding: new PrefixEncoding(new BufferEncoding(), new BufferEncoding(), 4),
    valueEncoding: new BufferEncoding(),
  })

  const transactions: TransactionsStore = db.addStore({
    name: 't',
    keyEncoding: new PrefixEncoding(new BufferEncoding(), new BufferEncoding(), 4),
    valueEncoding: new TransactionValueEncoding(),
  })

  const sequenceToNoteHash: SequenceToNoteHashStore = db.addStore({
    name: 's',
    keyEncoding: new PrefixEncoding(
      new BufferEncoding(),
      new PrefixEncoding(U32_ENCODING, new BufferEncoding(), 4),
      4,
    ),
    valueEncoding: NULL_ENCODING,
  })

  const nonChainNoteHashes: NonChainNoteHashesStore = db.addStore({
    name: 'S',
    keyEncoding: new PrefixEncoding(new BufferEncoding(), new BufferEncoding(), 4),
    valueEncoding: NULL_ENCODING,
  })

  const pendingTransactionHashes: PendingTransactionHashesStore = db.addStore({
    name: 'p',
    keyEncoding: new PrefixEncoding(
      new BufferEncoding(),
      new PrefixEncoding(U32_ENCODING, new BufferEncoding(), 4),
      4,
    ),
    valueEncoding: NULL_ENCODING,
  })

  return {
    meta,
    decryptedNotes,
    headHashes,
    balances,
    nullifierToNoteHash,
    accounts,
    transactions,
    sequenceToNoteHash,
    nonChainNoteHashes,
    pendingTransactionHashes,
  }
}
