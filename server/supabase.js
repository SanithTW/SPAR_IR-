const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://mileigpvdpsuzbdtzlle.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials missing in environment variables. Falling back to local database.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

/**
 * Upload a file buffer or stream directly to Supabase Storage
 * @param {Buffer} fileBuffer
 * @param {string} originalName
 * @param {string} mimeType
 * @returns {Promise<string>} Public URL of uploaded file
 */
async function uploadToSupabaseStorage(fileBuffer, originalName, mimeType) {
  const fileExt = originalName.split('.').pop();
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { data, error } = await supabase.storage
    .from('posm-attachments')
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true
    });

  if (error) {
    throw error;
  }

  const { data: publicData } = supabase.storage
    .from('posm-attachments')
    .getPublicUrl(filePath);

  return publicData.publicUrl;
}

module.exports = {
  supabase,
  uploadToSupabaseStorage
};
