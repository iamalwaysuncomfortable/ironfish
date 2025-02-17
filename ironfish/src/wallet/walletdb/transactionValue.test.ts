/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { createNodeTest, useMinersTxFixture } from '../../testUtilities'
import { TransactionValue, TransactionValueEncoding } from './transactionValue'

describe('TransactionValueEncoding', () => {
  const nodeTest = createNodeTest()

  function expectTransactionValueToMatch(a: TransactionValue, b: TransactionValue): void {
    // Test transaction separately because it's not a primitive type
    expect(a.transaction.equals(b.transaction)).toBe(true)
    expect({ ...a, transaction: undefined }).toMatchObject({ ...b, transaction: undefined })
  }

  describe('with a null block hash and sequence', () => {
    // eslint-disable-next-line jest/expect-expect
    it('serializes the object into a buffer and deserializes to the original object', async () => {
      const encoder = new TransactionValueEncoding()

      const transaction = await useMinersTxFixture(nodeTest.wallet)

      const value: TransactionValue = {
        transaction,
        blockHash: null,
        sequence: null,
        submittedSequence: null,
      }
      const buffer = encoder.serialize(value)
      const deserializedValue = encoder.deserialize(buffer)
      expectTransactionValueToMatch(deserializedValue, value)
    })
  })

  describe('with a null block hash', () => {
    // eslint-disable-next-line jest/expect-expect
    it('serializes the object into a buffer and deserializes to the original object', async () => {
      const encoder = new TransactionValueEncoding()

      const transaction = await useMinersTxFixture(nodeTest.wallet)

      const value: TransactionValue = {
        transaction,
        blockHash: null,
        sequence: null,
        submittedSequence: 123,
      }
      const buffer = encoder.serialize(value)
      const deserializedValue = encoder.deserialize(buffer)
      expectTransactionValueToMatch(deserializedValue, value)
    })
  })

  describe('with a null sequence', () => {
    // eslint-disable-next-line jest/expect-expect
    it('serializes the object into a buffer and deserializes to the original object', async () => {
      const encoder = new TransactionValueEncoding()

      const transaction = await useMinersTxFixture(nodeTest.wallet)

      const value: TransactionValue = {
        transaction,
        blockHash: Buffer.alloc(32, 1),
        sequence: 124,
        submittedSequence: null,
      }
      const buffer = encoder.serialize(value)
      const deserializedValue = encoder.deserialize(buffer)
      expectTransactionValueToMatch(deserializedValue, value)
    })
  })

  describe('with all fields defined', () => {
    // eslint-disable-next-line jest/expect-expect
    it('serializes the object into a buffer and deserializes to the original object', async () => {
      const encoder = new TransactionValueEncoding()

      const transaction = await useMinersTxFixture(nodeTest.wallet)

      const value: TransactionValue = {
        transaction,
        blockHash: Buffer.alloc(32, 1),
        sequence: 124,
        submittedSequence: 123,
      }

      const buffer = encoder.serialize(value)
      const deserializedValue = encoder.deserialize(buffer)
      expectTransactionValueToMatch(deserializedValue, value)
    })
  })
})
