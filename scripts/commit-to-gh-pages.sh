rm -rf ./public &&
git worktree prune &&
git worktree add public gh-pages &&
npm run build &&
cd public &&
git add --all &&
git commit -m "Publishing to gh-pages" &&
cd ..