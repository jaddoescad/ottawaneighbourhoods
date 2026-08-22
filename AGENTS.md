# Repository instructions

These instructions apply to the entire repository.

## Vercel deployment safety

- The only valid Vercel production project is `jad-slims-projects/ottawahoods`.
- The only valid production domains are `ottawahoods.com` and `www.ottawahoods.com`.
- Never create, delete, rename, or transfer a Vercel project, deployment, domain, or team from this repository.
- Never run a raw `vercel`, `vercel deploy`, or `vercel --prod` command.
- Never deploy when `.vercel/project.json` is absent or when `npm run vercel:check` fails.
- Create deployments only through `npm run deploy:preview`.
- Before production, verify the preview and promote that exact artifact with `npm run deploy:promote -- <preview-url>`.
- Production promotion requires explicit user authorization in the current conversation.
- If production is unhealthy, use Vercel rollback or promote the previous known-good deployment. Do not delete the project or its domains.
- Before reporting success, verify both the deployment URL and `https://www.ottawahoods.com` return successfully.

## Change safety

- Preserve unrelated user changes.
- Run the production build before creating a preview deployment.
- Commit the intended source changes before promoting a preview to production so the deployed code always has a Git recovery point.
