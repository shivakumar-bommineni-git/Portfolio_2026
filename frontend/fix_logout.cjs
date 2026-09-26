const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

code = code.replace(
  'const { user } = useAuth();', 
  'const { user, logout } = useAuth();'
);

code = code.replace(
  '<button style={{ flex: 1, display: \'flex\', alignItems: \'center\', justifyContent: \'center\', gap: \'.5rem\', padding: \'.75rem\', background: \'#ef4444\', border: \'none\', borderRadius: 12, color: \'#fff\', fontSize: \'.9rem\', fontWeight: 700, cursor: \'pointer\', boxShadow: \'0 4px 12px rgba(239, 68, 68, 0.25)\' }}>',
  '<button onClick={async () => { await logout(); navigate(\'/\', { replace: true }); }} style={{ flex: 1, display: \'flex\', alignItems: \'center\', justifyContent: \'center\', gap: \'.5rem\', padding: \'.75rem\', background: \'#ef4444\', border: \'none\', borderRadius: 12, color: \'#fff\', fontSize: \'.9rem\', fontWeight: 700, cursor: \'pointer\', boxShadow: \'0 4px 12px rgba(239, 68, 68, 0.25)\' }}>'
);

fs.writeFileSync('src/pages/Dashboard.jsx', code, 'utf8');
