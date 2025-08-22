// Connexion simple à la base de données (optionnel)
export async function connectDB() {
  try {
    console.log('📦 Storage initialized (file-based)');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
