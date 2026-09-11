# Enrollment Roster precedes Student identity

The master list is stored as an Enrollment Roster rather than pre-creating Student records with placeholder identity-provider IDs. A Student exists only after a verified school Google identity claims its roster entry: exact GBox email claims automatically, while an absent or non-GBox spreadsheet email requires Student ID plus first/last-name verification. This keeps identity assertions with Google and preserves every enrolled person before their first sign-in.
