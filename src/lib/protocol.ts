export type PubKeyHex = string
export const CROWD_BOX = 'crowd'
export const MESSAGEBOX_HOST = 'https://gmb.bsvblockchain.tech'
export const MULTISIG_PROTOCOL: [1, string] = [1, 'multi sig brc29']
export const BRC29_PROTOCOL: [2, string] = [2, '3241645161d8']

export interface InviteMsg {
  type: 'invite'
  escrowId: string            // funding `${txid}.${vout}`
  beef: string                // funding tx AtomicBEEF, hex
  satoshis: number
  threshold: number
  keyID: string               // nonce for multisig derivation
  originator: PubKeyHex       // identity key
  controllers: PubKeyHex[]    // identity keys, originator included
  pubkeys: PubKeyHex[]        // derived multisig pubkeys, same order as controllers
  refundPkh: string           // hex hash160 of refund pubkey (display/audit only)
  name: string                // human label for the escrow
  createdAt: number
}
export interface ProposalMsg {
  type: 'proposal'
  escrowId: string
  proposalId: string          // unsigned tx id (hex)
  rawTx: string               // unsigned spending tx, hex
  note: string
  proposer: PubKeyHex
  recipient?: { identityKey: PubKeyHex, derivationPrefix: string, derivationSuffix: string }
  createdAt: number
}
export interface SignatureMsg {
  type: 'signature'
  escrowId: string
  proposalId: string
  signer: PubKeyHex           // identity key of signer
  sigHex: string              // checksig-format signature, hex
}
export interface VetoMsg { type: 'veto', escrowId: string, proposalId: string, vetoer: PubKeyHex, reason?: string }
export interface FinalizedMsg { type: 'finalized', escrowId: string, proposalId: string, txid: string }
export interface CancelledMsg { type: 'cancelled', escrowId: string, txid: string }
export type CrowdMessage = InviteMsg | ProposalMsg | SignatureMsg | VetoMsg | FinalizedMsg | CancelledMsg

export function isCrowdMessage (x: unknown): x is CrowdMessage {
  if (typeof x !== 'object' || x === null) return false
  const t = (x as { type?: unknown }).type
  return t === 'invite' || t === 'proposal' || t === 'signature' ||
         t === 'veto' || t === 'finalized' || t === 'cancelled'
}
