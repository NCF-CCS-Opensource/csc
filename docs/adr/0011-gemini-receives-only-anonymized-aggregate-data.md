# Gemini receives only anonymized aggregate data

Reports use Google Gemini (3.1 Flash Lite via Google AI SDK) to generate narrative analysis sections within PDF attendance and financial reports. We decided that Gemini receives only anonymized, aggregate statistics — attendance rates, penalty totals, program breakdowns, counts — never student names, student IDs, or individual records. The per-student detail tables in the PDF are rendered directly by `@react-pdf/renderer` from database data without passing through the AI provider.

This protects student PII from leaving the Supabase boundary for AI processing, avoids coupling the narrative quality to individual data access, and means a Gemini API failure only loses the narrative section — the structured data report still generates. The trade-off is that Gemini cannot reference individual students by name in its analysis (e.g. "Student X has the most absences"), but that level of AI commentary on individuals is not desired in an institutional report anyway.

## Considered Options

- **Send real student data**: Richer narratives referencing individuals, but sends PII to an external API for every report generation.
- **Pseudonymized data**: Replace names with placeholders, let Gemini generate, substitute back. Middle complexity for marginal narrative benefit.
- **Aggregated only (chosen)**: Gemini sees numbers and rates; code renders names. Cleanest privacy boundary.
