# Skill: Web Deployment

- Whenever the user says "push to production":
  1. Run `git status` to check the state.
  2. If there are changes, run `git add .`.
  3. Run `git commit -m "update"`.
  4. Run `git push`.
  5. Run `vercel --prod`.
- Always check `git status` before performing any git actions.
- If a build fails on Vercel, read the logs using `vercel logs` and sugges