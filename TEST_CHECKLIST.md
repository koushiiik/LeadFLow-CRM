# LeadFlow CRM - Minimum Test Checklist

Test run executed against local MongoDB and live Express/Vite full-stack deployment.

| Area | Test Case | Expected Result | Actual Result | Status | Notes |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Health** | `GET /api/v1/health` check | HTTP 200 with status `UP` without exposing secrets | HTTP 200: `{"status":"UP","uptime":...}` | **PASS** | Secrets omitted from response |
| **Authentication** | Register new user | HTTP 201 with JWT token and safe user profile (no `passwordHash`) | HTTP 201, token generated, `passwordHash` omitted | **PASS** | Hashed via `bcryptjs` (salt 10) |
| **Authentication** | Reject duplicate email registration | HTTP 409 Conflict with error message | HTTP 409: "A user with this email address is already registered" | **PASS** | Unique email constraint enforced |
| **Authentication** | Log in with valid credentials | HTTP 200 with bearer token and user profile | HTTP 200: "Login successful" with JWT | **PASS** | Validated via `comparePassword` |
| **Authentication** | Reject invalid credentials | HTTP 401 Unauthorized | HTTP 401: "Invalid email or password" | **PASS** | Generic error to prevent enumeration |
| **Authentication** | Reject missing/invalid token | HTTP 401 Unauthorized | HTTP 401 on missing and invalid tokens | **PASS** | `authMiddleware` checks signature & expiry |
| **Leads** | Reject lead with missing name | HTTP 400 Bad Request | HTTP 400: "Lead name is required" | **PASS** | Mandatory field check |
| **Leads** | Reject lead missing both email and phone | HTTP 400 Bad Request | HTTP 400: "At least one of email or phone must be provided" | **PASS** | Rule enforced |
| **Leads** | Reject invalid email format | HTTP 400 Bad Request | HTTP 400: "Invalid email format provided" | **PASS** | Regex format validation |
| **Leads** | Reject negative budget | HTTP 400 Bad Request | HTTP 400: "Budget must be greater than or equal to 0" | **PASS** | Value >= 0 check |
| **Leads** | Create valid lead | HTTP 201 Created with `createdBy` assigned server-side | HTTP 201, `createdBy` strictly matches `req.user._id` | **PASS** | User ID never trusted from body |
| **Leads** | Get lead by ID after access check | HTTP 200 with lead data and follow-ups | HTTP 200 with lead record | **PASS** | Validates ObjectId & ownership |
| **Leads** | Update permitted lead fields | HTTP 200 with updated fields | HTTP 200: stage updated to 'Qualified', budget to 18000 | **PASS** | Field allowlist enforced |
| **Leads** | Reject modification of restricted fields | HTTP 400 Bad Request | HTTP 400: "Modification of restricted fields is not permitted: createdBy" | **PASS** | Rejects `_id`, `createdBy`, timestamps |
| **Leads** | Search by name/company and filter by stage | HTTP 200 returning matching leads | HTTP 200 returning filtered array | **PASS** | Search and stage query params work |
| **Follow-ups** | Reject nonexistent lead reference | HTTP 404 / 400 lead not found error | HTTP 404: "Referenced lead not found" | **PASS** | Validates lead existence and access |
| **Follow-ups** | Create follow-up for valid lead | HTTP 201 with populated lead | HTTP 201, populated lead information | **PASS** | Default status 'Pending' |
| **Follow-ups** | Mark follow-up complete | HTTP 200 with `status: 'Completed'` and server `completedAt` | HTTP 200, `completedAt` timestamp set | **PASS** | Cleared if reverted to Pending |
| **Dashboard** | Dashboard metrics from database | HTTP 200 with counts matching real records | HTTP 200: dynamic counts for total, active, won, pending, overdue | **PASS** | No hardcoded metrics |
| **Leads** | Delete lead (Cascading Delete) | HTTP 200 and associated activities deleted | HTTP 200, 0 leftover activities in database | **PASS** | Data integrity verified |
| **Persistence** | Data persistence across reloads | Database state remains after refresh | Verified against MongoDB database `leadflow_crm` | **PASS** | Mongoose persistent collections |

All 21 test scenarios executed and verified.
