# Project Rules & Constraints

## Shopify JSON Templates Rule
- **Strict JSON Compliance**: Never include JavaScript-style comments (`/* ... */` or `// ...`) in Shopify `.json` template files (e.g. `templates/*.json`, `sections/*.json`). Always ensure files in the theme are 100% compliant with standard JSON syntax to avoid IDE lint errors and build warnings.

## Shopify Section Schema Labels Rule
- **Max 50 Characters**: In Shopify section `%schema%` blocks, every setting `label` and option `label` string MUST be 50 characters or fewer. Exceeding 50 characters causes Shopify validation to fail with "setting option label is too long (max 50 characters)".
