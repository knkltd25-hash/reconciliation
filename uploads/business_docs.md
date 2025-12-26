# Supply Chain Reason Tagging Business Rules Documentation

## Overview
This document is the single source of truth for all business rules used in supply chain reason tagging. The tagging agent references these rules, ChromaDB metadata, and LLM-inferred logic for tagging reasons. No validation or reconciliation logic is included.

---

## 1. Quantity-Related Reasons
- **Under-delivery**: If the sum of all GRN `Received_Quantity` for a PO is less than the PO's `Quantity`, tag as "Under-delivery".
- **Over-delivery**: If the sum of all GRN `Received_Quantity` for a PO is greater than the PO's `Quantity`, tag as "Over-delivery".
- **Partial Shipments**: If the sum matches but there are multiple GRNs for a PO, tag as "Partial shipments".
- **Missing GRN**: If a PO has no GRN record, tag as "Missing GRN".
- **ASN/GRN Mismatch**: If ASN shipped quantity does not match GRN received quantity for a PO, tag as "ASN/GRN mismatch".

## 2. Price-Related Reasons
- **Total Price Discrepancy**: If `Quantity * Unit_Price` in PO does not match `Invoice_Amount` in Invoice, tag as "Total price discrepancy".
- **Unit Price Mismatch**: If PO `Unit_Price` does not match Invoice `Unit_Price`, tag as "Unit price mismatch".
- **Currency Mismatch**: If PO and Invoice currencies differ, tag as "Currency mismatch".

## 3. Delivery-Related Reasons
- **Late Delivery**: If the earliest GRN `Received_Date` is after the PO's `Delivery_Date`, tag as "Late delivery".

## 4. Invoice Quantity Mismatch
- **Invoice/GRN Quantity Mismatch**: If Invoice quantity does not match GRN received quantity for a PO, tag as "Invoice/GRN quantity mismatch".

## 5. Custom Business Logic
- **Custom Rule**: Any additional business logic or rule can be added here and referenced by the agent.

- if none of the reason bucket is satisfied,tag it as No issues

---

## Grouping and Output
- For each PO, group all detected reasons and output all applicable reasons and comments.
- If no mismatches or reasons are found for a PO, tag as "No mismatch".

---

## Example Output
| PO_ID   | reason(s)                        | Comments(s)                       |
|---------|----------------------------------|-----------------------------------|
| PO123   | Under-delivery                   | Received less than ordered        |
| PO456   | No mismatch                      |                                   |

---

## How the Agent Works
1. Loads all relevant tables from Postgres.
2. Uses ChromaDB metadata to understand table structure and relationships.
3. Applies all rules from this document for mismatch detection and reason tagging.
4. Groups results by PO_ID, listing all reasons per PO.
5. Ensures every PO is tagged (with all reasons or "No mismatch").
6. Saves output for analytics and dashboarding.

---

## References
- ChromaDB metadata
- LLM prompt engineering
- API logic

---

## Contact
For questions or updates, contact the supply chain analytics team.
