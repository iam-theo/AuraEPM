import fs from 'fs';
const content = fs.readFileSync('src/components/UsersView.tsx', 'utf8');
console.log(content.includes('api.get("/v1/auth/users")'));
