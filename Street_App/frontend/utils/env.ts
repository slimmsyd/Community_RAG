export function validateEnv() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_PROJECT_ID',
    'MONGODB_URI',
    // Add other required env vars here
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
  }
} 