# Next actions

Checklist of drift-to-code and follow-up items.

---

- [ ] **Backend CDK**: Add `https://app.blomso.com/auth/callback` (and current production sign-out origin `https://app.blomso.com`) to User Pool Client callback URLs and logout URLs (e.g. via CDK context or stack props) so future deploys do not overwrite console-configured URLs.

- [ ] **API Gateway CORS**: Ensure CORS in repo (CDK or OpenAPI) matches console (origins: app.blomso.com, Amplify URL, localhost:5173; headers: Authorization, Content-Type; methods: GET, POST, PUT, PATCH, DELETE, OPTIONS). If not codified, document the manual CORS step after each deploy.

- [ ] **Cognito branding**: Managed login and custom styling are configured in console. Document that branding is console-only unless/until codified (e.g. CloudFormation or CDK customizations).
