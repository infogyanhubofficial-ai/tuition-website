require('dotenv').config({ path: '.env.local' }); 
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 1. Initialize Supabase using your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Using the Service Role Key is best for bulk uploads if you have it, otherwise Anon key works
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase URL or Key in .env.local file!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Automatically find the "certi" folder on your Desktop
const desktopPath = path.join(os.homedir(), 'Desktop', 'certi');
const BATCH_SIZE = 20; // Process 20 images at a time to prevent rate limits

async function processMassUpload() {
  console.log(`📂 Looking for images in: ${desktopPath}`);
  
  if (!fs.existsSync(desktopPath)) {
    console.error("❌ Could not find the 'certi' folder on your Desktop!");
    return;
  }

  // Get all .png and .jpg files from the folder
  const allFiles = fs.readdirSync(desktopPath).filter(file => 
    file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
  );
  
  console.log(`✅ Found ${allFiles.length} certificates to upload.\n`);

  // 3. Process the uploads in small batches
  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    const batch = allFiles.slice(i, i + BATCH_SIZE);
    console.log(`🚀 Uploading batch ${i + 1} to ${i + batch.length} of ${allFiles.length}...`);

    const uploadPromises = batch.map(async (fileName) => {
      try {
        const filePath = path.join(desktopPath, fileName);
        const fileBuffer = fs.readFileSync(filePath);

        // Upload to the 'certificates' bucket. 
        // We use just 'fileName' here so it saves as e.g., '6937d7f8...png' 
        // which matches your database's 'certificates/6937d7f8...png' path.
        const { error } = await supabase.storage
          .from('certificates')
          .upload(fileName, fileBuffer, {
            contentType: fileName.endsWith('.png') ? 'image/png' : 'image/jpeg',
            upsert: true // If the file already exists, this overwrites it safely
          });

        if (error) throw error;
        console.log(`   ✔️ Success: ${fileName}`);
      } catch (error) {
        console.error(`   ❌ Failed: ${fileName} - ${error.message}`);
      }
    });

    // Wait for the current batch of 20 to finish
    await Promise.all(uploadPromises);

    // ⏳ PAUSE FOR 1.5 SECONDS
    // This stops Supabase from blocking you for sending too many requests at once.
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log('\n🎉 BULK UPLOAD COMPLETE!');
}

// Start the script
processMassUpload();