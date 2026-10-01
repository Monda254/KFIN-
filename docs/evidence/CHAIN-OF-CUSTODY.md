# KFIN Chain-of-Custody Specification

## 1. Overview
The Chain of Custody in KFIN is an immutable, append-only historical record of every physical and digital movement, transfer, examination, seal modification, and access event associated with a forensic exhibit.

## 2. Immutable Custody Event Structure
Every custody event captures:
- **`id`**: Unique event UUID.
- **`evidenceId`**: Target exhibit UUID.
- **`action`**: Performed action (`COLLECT`, `SEAL`, `TRANSFER_INITIATE`, `TRANSFER_RECEIVE`, `RETRIEVE`, `RETURN`, `EXAMINE`, `DISPOSE`).
- **`actorId`**: Authenticated officer/examiner UUID.
- **`fromCustodianId` & `toCustodianId`**: Transferor and Transferee user IDs.
- **`fromLocationId` & `toLocationId`**: Source and Destination storage location IDs.
- **`purpose`**: Mandatory operational/legal justification for movement.
- **`authorizationReference`**: Court order, search warrant, or lab requisition reference.
- **`sealStatus` & `condition`**: Exhibit physical integrity state at moment of event.
- **`eventTimestamp`**: Server-authoritative UTC timestamp.

## 3. Handshake Transfer Workflow
No transfer is implicit. Handshake sequence:
1. Releasing custodian calls `initiateTransfer(...)`. State shifts to `TRANSFERRED`.
2. Receiving custodian inspects physical package and seal.
3. Receiving custodian calls `receiveTransfer(...)`. State shifts to `RECEIVED` (or `EXCEPTION` if seal is broken/tampered).
4. Current custodian is updated only upon successful receipt confirmation.
