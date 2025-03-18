/**
 * This script fixes path issues by creating symbolic links in the necessary locations
 */
const fs = require('fs');
const path = require('path');

// Define paths
const APP_DIR = path.join(__dirname, 'app');
const API_DIR = path.join(APP_DIR, 'api');
const AUTH_DIR = path.join(API_DIR, 'auth');
const AUTH_NEXTAUTH_DIR = path.join(AUTH_DIR, '[...nextauth]');
const AUTH_DISCORD_DIR = path.join(AUTH_DIR, 'discord');
const AUTH_DISCORD_CALLBACK_DIR = path.join(AUTH_DISCORD_DIR, 'callback');

// Make sure directories exist
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Copy auth-related files to the expected locations
function copyFiles() {
  // First ensure all directories exist
  [
    AUTH_NEXTAUTH_DIR,
    AUTH_DISCORD_CALLBACK_DIR,
    path.join(AUTH_NEXTAUTH_DIR, 'lib'),
    path.join(AUTH_NEXTAUTH_DIR, 'models'),
    path.join(AUTH_DISCORD_CALLBACK_DIR, 'lib')
  ].forEach(ensureDirExists);

  // Copy dbConnect.ts to the expected location for [...nextauth]/route.ts
  fs.copyFileSync(
    path.join(API_DIR, 'lib', 'dbConnect.ts'),
    path.join(AUTH_NEXTAUTH_DIR, 'lib', 'dbConnect.ts')
  );
  console.log('Copied dbConnect.ts to auth/[...nextauth]/lib/');

  // Copy User.ts to the expected location for [...nextauth]/route.ts
  fs.copyFileSync(
    path.join(API_DIR, 'models', 'User.ts'),
    path.join(AUTH_NEXTAUTH_DIR, 'models', 'User.ts')
  );
  console.log('Copied User.ts to auth/[...nextauth]/models/');

  // Copy authOptions.ts to the expected location for discord/callback/route.ts
  fs.copyFileSync(
    path.join(API_DIR, 'lib', 'authOptions.ts'),
    path.join(AUTH_DISCORD_CALLBACK_DIR, 'lib', 'authOptions.ts')
  );
  console.log('Copied authOptions.ts to auth/discord/callback/lib/');
}

// Update route.ts files to use local imports
function updateRouteFiles() {
  // Update [...nextauth]/route.ts
  const nextauthRoutePath = path.join(AUTH_NEXTAUTH_DIR, 'route.ts');
  if (fs.existsSync(nextauthRoutePath)) {
    let content = fs.readFileSync(nextauthRoutePath, 'utf8');
    content = content.replace(
      "import { authOptions } from \"../../lib/authOptions\";",
      "import { authOptions } from \"../../lib/authOptions\";"
    );
    content = content.replace(
      "import dbConnect from '../../lib/dbConnect';",
      "import dbConnect from './lib/dbConnect';"
    );
    content = content.replace(
      "import User from '../../models/User';",
      "import User from './models/User';"
    );
    fs.writeFileSync(nextauthRoutePath, content);
    console.log('Updated imports in [...nextauth]/route.ts');
  }

  // Update discord/callback/route.ts
  const discordCallbackRoutePath = path.join(AUTH_DISCORD_CALLBACK_DIR, 'route.ts');
  if (fs.existsSync(discordCallbackRoutePath)) {
    let content = fs.readFileSync(discordCallbackRoutePath, 'utf8');
    content = content.replace(
      "import { authOptions } from \"../../../lib/authOptions\";",
      "import { authOptions } from \"./lib/authOptions\";"
    );
    fs.writeFileSync(discordCallbackRoutePath, content);
    console.log('Updated imports in discord/callback/route.ts');
  }
}

// Run the fix
try {
  copyFiles();
  updateRouteFiles();
  console.log('Auth path fixes complete!');
} catch (error) {
  console.error('Error fixing auth paths:', error);
} 