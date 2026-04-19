git checkout main
git checkout master -- backend/src/auth/auth.service.ts
git commit -m "fix: remove syntax error from main branch"
git push origin main
git push render-repo main
git checkout master
